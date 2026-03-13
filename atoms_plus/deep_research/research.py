"""Core research logic for Deep Research functionality.

This module implements the main research pipeline:
1. Generate report structure using LLM
2. Research all sections in parallel (max 3 concurrent):
   a. Execute initial searches in parallel
   b. Summarize results using LLM
   c. Reflect and identify gaps (up to max_rounds)
   d. Execute supplementary searches if needed
3. Generate final report

All operations are async for non-blocking execution.
Sections are processed in parallel with a semaphore for concurrency control.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time
import uuid
from collections.abc import Awaitable, Callable

import litellm

from atoms_plus.deep_research.models import (
    ReportSection,
    ReportStructure,
    ResearchProgress,
    ResearchResponse,
    SearchResult,
    SectionResult,
)
from atoms_plus.deep_research.prompts import (
    FINAL_REPORT_PROMPT,
    FINAL_REPORT_PROMPT_TECH,
    REFLECT_PROMPT,
    STRUCTURE_PROMPT,
    STRUCTURE_PROMPT_TECH,
    SUMMARIZE_PROMPT,
    # Tech stack decision (Stage 1)
    TECH_STACK_DECISION,
    # Sectioned prompts for parallel generation (Stage 2)
    TECH_SECTION_CHECKLIST,
    TECH_SECTION_DATABASE,
    TECH_SECTION_DEPLOYMENT,
    TECH_SECTION_FEATURES,
    TECH_SECTION_INTEGRATIONS,
    TECH_SECTION_QUICK_START,
    TECH_SECTION_STACK,
)
from atoms_plus.deep_research.query_rewriter import (
    IntentType,
    RewrittenQuery,
    rewrite_query,
)
from atoms_plus.deep_research.search import SearchEngine, get_search_engine

logger = logging.getLogger(__name__)


# =============================================================================
# LLM Helper Function
# =============================================================================


async def _call_llm(prompt: str, timeout: int = 120) -> str:
    """Call LLM API using litellm.

    Uses environment variables:
        - LLM_API_KEY: API key
        - LLM_BASE_URL: API base URL
        - LLM_MODEL: Model name (e.g., openai/MiniMax-M2.5)

    Args:
        prompt: The prompt to send to the LLM
        timeout: Request timeout in seconds (default: 120, use 600 for long reports)
    """
    model = os.getenv("LLM_MODEL", "openai/MiniMax-M2.5")
    api_key = os.getenv("LLM_API_KEY")
    api_base = os.getenv("LLM_BASE_URL")

    logger.debug(f"Calling LLM: {model}, timeout: {timeout}s")

    response = await litellm.acompletion(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        api_key=api_key,
        api_base=api_base,
        timeout=timeout,
    )

    content = response.choices[0].message.content
    logger.debug(f"LLM response: {len(content)} chars")
    return content


async def _call_llm_streaming(
    prompt: str,
    on_chunk: Callable[[str], Awaitable[None]] | None = None,
    timeout: int = 600,
) -> str:
    """Call LLM API with streaming, forwarding chunks to a callback.

    Falls back to non-streaming _call_llm when on_chunk is None.
    """
    if on_chunk is None:
        return await _call_llm(prompt, timeout=timeout)

    model = os.getenv("LLM_MODEL", "openai/MiniMax-M2.5")
    api_key = os.getenv("LLM_API_KEY")
    api_base = os.getenv("LLM_BASE_URL")

    logger.debug(f"Calling LLM (streaming): {model}, timeout: {timeout}s")

    response = await litellm.acompletion(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        api_key=api_key,
        api_base=api_base,
        timeout=timeout,
        stream=True,
    )

    collected: list[str] = []
    async for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            collected.append(delta)
            await on_chunk(delta)

    full_content = "".join(collected)
    logger.debug(f"LLM streaming response: {len(full_content)} chars")
    return full_content


# =============================================================================
# Internal Pipeline Functions
# =============================================================================


async def _generate_structure(
    query: str, intent: IntentType | None = None
) -> ReportStructure:
    """Generate report structure using LLM.

    Args:
        query: Research topic or refined query
        intent: User intent type (BUILD_APP uses technical prompt)
    """
    logger.info(f"Generating structure for: {query} (intent={intent})")

    # Use technical prompt for BUILD_APP intent
    if intent == IntentType.BUILD_APP:
        prompt = STRUCTURE_PROMPT_TECH.format(query=query)
    else:
        prompt = STRUCTURE_PROMPT.format(query=query)
    response = await _call_llm(prompt)

    # Extract JSON from response
    json_match = re.search(r"```json\s*(.*?)\s*```", response, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        # Try to find raw JSON
        json_str = response

    try:
        data = json.loads(json_str)
        sections = [
            ReportSection(
                title=s.get("title", ""),
                search_query=s.get("search_query", ""),
                description=s.get("description"),
            )
            for s in data.get("sections", [])
        ]
        return ReportStructure(title=data.get("title", query), sections=sections)
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse structure JSON: {e}")
        # Fallback: create a simple structure
        return ReportStructure(
            title=query,
            sections=[
                ReportSection(title="Overview", search_query=query),
                ReportSection(title="Key Findings", search_query=f"{query} trends"),
                ReportSection(title="Analysis", search_query=f"{query} analysis"),
            ],
        )


async def _summarize(results: list[SearchResult], topic: str) -> str:
    """Summarize search results using LLM."""
    logger.info(f"Summarizing {len(results)} results for: {topic}")

    # Format search results for prompt
    formatted = "\n\n".join(
        f"[{i + 1}] {r.title}\n{r.url}\n{r.snippet}" for i, r in enumerate(results)
    )

    prompt = SUMMARIZE_PROMPT.format(topic=topic, search_results=formatted)
    return await _call_llm(prompt)


async def _reflect(summary: str, topic: str) -> str:
    """Reflect on summary and identify gaps."""
    logger.info(f"Reflecting on summary for: {topic}")

    prompt = REFLECT_PROMPT.format(topic=topic, summary=summary)
    response = await _call_llm(prompt)

    # Clean response
    response = response.strip()
    if response.upper() == "COMPLETE":
        return "COMPLETE"
    return response


async def _decide_tech_stack(title: str, section_content: str) -> str:
    """Stage 1: Decide the tech stack for the project.

    This runs BEFORE parallel section generation to ensure all sections
    use the same technology choices.

    Args:
        title: Report title
        section_content: Combined content from research sections

    Returns:
        A formatted string describing the locked tech stack
    """
    logger.info("Stage 1: Deciding tech stack...")
    prompt = TECH_STACK_DECISION.format(
        title=title,
        section_content=section_content,
    )
    response = await _call_llm(prompt, timeout=120)

    # Try to parse JSON from the response
    try:
        # Extract JSON from markdown code block if present
        json_match = re.search(r"```json\s*(.*?)\s*```", response, re.DOTALL)
        if json_match:
            stack_json = json.loads(json_match.group(1))
        else:
            stack_json = json.loads(response)

        # Format as readable tech stack summary
        frontend = stack_json.get("frontend", {})
        backend = stack_json.get("backend", {})
        database = stack_json.get("database", {})
        deployment = stack_json.get("deployment", {})
        summary = stack_json.get("summary", "")

        tech_stack = f"""
前端: {frontend.get("framework", "N/A")} + {frontend.get("ui", "N/A")} + {frontend.get("state", "N/A")}
后端: {backend.get("framework", "N/A")} + {backend.get("orm", "N/A")} + {backend.get("auth", "N/A")}
数据库: {database.get("primary", "N/A")} ({database.get("provider", "N/A")})
部署: {deployment.get("frontend", "N/A")} + {deployment.get("backend", "N/A")}

总结: {summary}
""".strip()
        logger.info(f"Tech stack decided: {summary}")
        return tech_stack

    except (json.JSONDecodeError, KeyError) as e:
        logger.warning(f"Failed to parse tech stack JSON: {e}, using raw response")
        return response


async def _generate_section_parallel(
    title: str,
    section_content: str,
    tech_stack: str,
    prompt_template: str,
) -> str:
    """Generate a single section using the given prompt template.

    Args:
        title: Report title
        section_content: Combined content from research sections
        tech_stack: The locked tech stack from Stage 1
        prompt_template: The section-specific prompt template
    """
    prompt = prompt_template.format(
        title=title,
        section_content=section_content,
        tech_stack=tech_stack,
    )
    return await _call_llm(prompt, timeout=180)


async def _generate_final_report_sectioned(
    title: str,
    sections: list[SectionResult],
    all_sources: list[str],
    on_chunk: Callable[[str], Awaitable[None]] | None = None,
) -> str:
    """Generate technical report using two-stage generation.

    Stage 1: Decide tech stack (single LLM call)
    Stage 2: Generate 7 sections in parallel (all using the same tech stack)

    After assembly, emits the full report piece-by-piece via on_chunk so the
    WebSocket stays active during the (potentially long) generation window.

    Args:
        title: Report title
        sections: List of section results from research
        all_sources: All cited sources
        on_chunk: Optional callback for streaming assembled report to the client
    """
    logger.info(f"Generating sectioned report (two-stage): {title}")
    start_time = time.time()

    combined_content = "\n\n".join(f"### {s.title}\n{s.content}" for s in sections)

    # =========================================================================
    # Stage 1: Decide tech stack
    # =========================================================================
    tech_stack = await _decide_tech_stack(title, combined_content)
    stage1_time = time.time() - start_time
    logger.info(f"Stage 1 completed in {stage1_time:.1f}s")

    if on_chunk:
        await on_chunk(f"# {title}\n\n> Deciding tech stack... done\n\n")

    # =========================================================================
    # Stage 2: Generate sections in parallel with locked tech stack
    # =========================================================================
    section_tasks = [
        ("quick_start", TECH_SECTION_QUICK_START),
        ("stack", TECH_SECTION_STACK),
        ("database", TECH_SECTION_DATABASE),
        ("features", TECH_SECTION_FEATURES),
        ("integrations", TECH_SECTION_INTEGRATIONS),
        ("deployment", TECH_SECTION_DEPLOYMENT),
        ("checklist", TECH_SECTION_CHECKLIST),
    ]

    logger.info(f"Stage 2: Parallel generation of {len(section_tasks)} sections")
    stage2_start = time.time()

    results = await asyncio.gather(
        *[
            _generate_section_parallel(title, combined_content, tech_stack, template)
            for _, template in section_tasks
        ],
        return_exceptions=True,
    )

    stage2_time = time.time() - stage2_start
    logger.info(f"Stage 2 completed in {stage2_time:.1f}s")

    # =========================================================================
    # Assemble report — stream each piece to the client as it's assembled
    # =========================================================================
    report_parts = [f"# {title}\n"]

    report_parts.append(
        f"\n> **锁定技术栈**: {tech_stack.split('总结:')[-1].strip()}\n"
    )

    for i, (section_name, _) in enumerate(section_tasks):
        result = results[i]
        if isinstance(result, Exception):
            logger.warning(f"Section '{section_name}' failed: {result}")
            part = f"\n\n<!-- Section {section_name} generation failed -->\n"
        else:
            part = f"\n\n{result}"
        report_parts.append(part)
        if on_chunk:
            await on_chunk(part)

    sources_text = "\n".join(f"- {url}" for url in all_sources[:20])
    sources_part = f"\n\n## 参考来源\n{sources_text}"
    report_parts.append(sources_part)
    if on_chunk:
        await on_chunk(sources_part)

    total_time = time.time() - start_time
    logger.info(
        f"Total report generation: {total_time:.1f}s (Stage1: {stage1_time:.1f}s, Stage2: {stage2_time:.1f}s)"
    )

    return "".join(report_parts)


async def _generate_final_report(
    title: str,
    sections: list[SectionResult],
    all_sources: list[str],
    intent: IntentType | None = None,
    on_chunk: Callable[[str], Awaitable[None]] | None = None,
) -> str:
    """Generate final Markdown report with optional streaming.

    For BUILD_APP intent, uses parallel sectioned generation for faster results.
    For other intents, uses single-shot generation (streaming when on_chunk provided).

    Args:
        title: Report title
        sections: List of section results
        all_sources: All cited sources
        intent: User intent type (BUILD_APP uses parallel sectioned generation)
        on_chunk: Optional async callback receiving text chunks for streaming
    """
    logger.info(f"Generating final report: {title} (intent={intent})")

    if intent == IntentType.BUILD_APP:
        return await _generate_final_report_sectioned(
            title, sections, all_sources, on_chunk=on_chunk
        )

    sections_content = "\n\n".join(f"### {s.title}\n{s.content}" for s in sections)
    sources = "\n".join(f"- {url}" for url in all_sources[:20])

    prompt = FINAL_REPORT_PROMPT.format(
        title=title,
        sections_content=sections_content,
        sources=sources,
    )
    return await _call_llm_streaming(prompt, on_chunk=on_chunk, timeout=600)


# =============================================================================
# Section Worker (runs in parallel)
# =============================================================================

_MAX_CONCURRENT_SECTIONS = 3


async def _research_section(
    idx: int,
    section: ReportSection,
    total_sections: int,
    engine: SearchEngine,
    rewritten: RewrittenQuery | None,
    max_rounds: int,
    send_progress: Callable[..., Awaitable[None]],
) -> tuple[SectionResult, list[str]]:
    """Research a single section. Designed to run concurrently.

    Progress values are section-local (0.0-1.0). The frontend aggregates
    them into a global progress bar.

    Returns:
        (SectionResult, list of source URLs)
    """
    section_sources: list[str] = []

    async def section_progress(event: str, **kwargs):
        await send_progress(
            event,
            section_index=idx,
            section_title=section.title,
            total_sections=total_sections,
            **kwargs,
        )

    # Build search queries
    section_queries = [section.search_query]
    if rewritten and rewritten.search_queries:
        section_keywords = section.title.lower().split()
        for rq in rewritten.search_queries:
            if any(kw in rq.lower() for kw in section_keywords):
                section_queries.append(rq)
        section_queries = section_queries[:3]

    # Parallel search across all queries for this section
    search_tasks = []
    for sq in section_queries:
        await section_progress("searching", message=f"Searching: {sq}", progress=0.1)
        search_tasks.append(engine.search(sq, max_results=3))

    search_results_nested = await asyncio.gather(*search_tasks, return_exceptions=True)

    all_results: list[SearchResult] = []
    for r in search_results_nested:
        if isinstance(r, Exception):
            logger.warning(f"Search failed in section '{section.title}': {r}")
        else:
            all_results.extend(r)

    await section_progress("searching", message=f"Found {len(all_results)} results", progress=0.3)

    searched_queries = section_queries.copy()

    # Deduplicate by URL
    seen_urls: set[str] = set()
    unique_results: list[SearchResult] = []
    for r in all_results:
        if r.url and r.url not in seen_urls:
            seen_urls.add(r.url)
            unique_results.append(r)
    results = unique_results[:8]

    section_sources = [r.url for r in results if r.url]

    # Summarize
    await section_progress(
        "summarizing",
        message=f"Summarizing: {section.title}",
        progress=0.5,
    )
    summary = await _summarize(results, section.title)

    # Reflection loop
    for round_num in range(max_rounds):
        reflect_progress = 0.6 + 0.35 * (round_num + 1) / max_rounds
        await section_progress(
            "reflecting",
            current_round=round_num + 1,
            message=f"Reflecting (round {round_num + 1}/{max_rounds})",
            progress=reflect_progress,
        )

        gap_query = await _reflect(summary, section.title)
        if gap_query == "COMPLETE":
            logger.info(f"Section '{section.title}' complete after {round_num + 1} rounds")
            break

        logger.info(f"Gap identified in '{section.title}': {gap_query}")
        searched_queries.append(gap_query)
        additional_results = await engine.search(gap_query, max_results=3)
        section_sources.extend([r.url for r in additional_results if r.url])
        summary = await _summarize(results + additional_results, section.title)

    section_result = SectionResult(
        title=section.title,
        content=summary,
        sources=section_sources,
        search_queries=searched_queries,
    )
    return section_result, section_sources


# =============================================================================
# Main Entry Point
# =============================================================================


async def deep_research_async(
    query: str,
    max_rounds: int = 2,
    search_engine: str = "auto",
    language: str = "auto",
    enable_query_rewrite: bool = True,
    on_progress: Callable[[ResearchProgress], Awaitable[None]] | None = None,
) -> ResearchResponse:
    """Execute deep research on a topic.

    Sections are researched in parallel (up to _MAX_CONCURRENT_SECTIONS)
    for significantly faster execution.

    Args:
        query: Research topic or question (can be vague user input)
        max_rounds: Maximum reflection rounds per section (1-5)
        search_engine: Search engine preference ("auto", "tavily", "dashscope")
        language: Report language ("auto", "en", "zh")
        enable_query_rewrite: Enable Query Rewrite for vague inputs (default: True)
        on_progress: Async callback for progress updates (WebSocket streaming)

    Returns:
        ResearchResponse with complete report and metadata
    """
    session_id = str(uuid.uuid4())[:8]
    start_time = time.time()

    logger.info(f"Starting research [{session_id}]: {query}")

    engine: SearchEngine = get_search_engine(search_engine)

    async def send_progress(event: str, **kwargs):
        if on_progress:
            await on_progress(
                ResearchProgress(event=event, session_id=session_id, **kwargs)
            )

    await send_progress("started", message=f"Starting research: {query}", progress=0.0)

    # ── Step 0: Query Rewrite ────────────────────────────────────────────
    rewritten: RewrittenQuery | None = None
    if enable_query_rewrite:
        await send_progress(
            "rewriting", message="Analyzing intent and rewriting query...", progress=0.02
        )
        rewritten = await rewrite_query(query)
        logger.info(
            f"Query rewritten: intent={rewritten.intent.value}, "
            f"dimensions={len(rewritten.research_dimensions)}, "
            f"queries={len(rewritten.search_queries)}"
        )
        await send_progress(
            "rewrite_complete",
            message=f"Intent: {rewritten.intent.value}, "
            f"Generated {len(rewritten.search_queries)} search queries",
            progress=0.05,
            data={
                "intent": rewritten.intent.value,
                "dimensions": rewritten.research_dimensions,
                "queries": rewritten.search_queries[:5],
            },
        )
        query = rewritten.context_summary

    # ── Step 1: Generate report structure ─────────────────────────────────
    intent = rewritten.intent if rewritten else None
    structure = await _generate_structure(query, intent=intent)
    total_sections = len(structure.sections)
    logger.info(f"Generated structure with {total_sections} sections (intent={intent})")

    # Announce structure to frontend so it can pre-populate section lanes
    await send_progress(
        "structure_ready",
        message=f"Research plan: {total_sections} sections",
        total_sections=total_sections,
        progress=0.05,
        data={
            "sections": [
                {"index": i, "title": s.title}
                for i, s in enumerate(structure.sections)
            ],
        },
    )

    # ── Step 2: Research sections in parallel ─────────────────────────────
    semaphore = asyncio.Semaphore(_MAX_CONCURRENT_SECTIONS)

    async def bounded_research(idx: int, section: ReportSection):
        # Mark queued → running
        await send_progress(
            "section_started",
            section_index=idx,
            section_title=section.title,
            section_status="running",
            current_section=section.title,
            total_sections=total_sections,
        )
        async with semaphore:
            result = await _research_section(
                idx, section, total_sections, engine, rewritten, max_rounds, send_progress,
            )
        sec_result, sec_sources = result
        await send_progress(
            "section_completed",
            section_index=idx,
            section_title=section.title,
            section_status="done",
            current_section=section.title,
            progress=1.0,
            data={"sources": sec_sources[:10]},
        )
        return result

    logger.info(f"Launching {total_sections} section workers (max {_MAX_CONCURRENT_SECTIONS} concurrent)")
    gather_results = await asyncio.gather(
        *[bounded_research(i, s) for i, s in enumerate(structure.sections)],
        return_exceptions=True,
    )

    # Collect results, handling any failures
    section_results: list[SectionResult] = []
    all_sources: list[str] = []
    for i, result in enumerate(gather_results):
        if isinstance(result, Exception):
            logger.error(f"Section {i} '{structure.sections[i].title}' failed: {result}")
            await send_progress(
                "section_completed",
                section_index=i,
                section_title=structure.sections[i].title,
                section_status="error",
                message=str(result),
            )
            section_results.append(
                SectionResult(
                    title=structure.sections[i].title,
                    content=f"*Research failed: {result}*",
                    sources=[],
                    search_queries=[],
                )
            )
        else:
            sec_result, sec_sources = result
            section_results.append(sec_result)
            all_sources.extend(sec_sources)

    # ── Step 3: Generate final report (streaming) ──────────────────────────
    await send_progress(
        "generating_report", message="Generating final report", progress=0.95
    )
    unique_sources = list(dict.fromkeys(all_sources))

    async def report_chunk_callback(chunk: str) -> None:
        await send_progress("report_chunk", data={"chunk": chunk})

    final_report = await _generate_final_report(
        structure.title,
        section_results,
        unique_sources,
        intent=intent,
        on_chunk=report_chunk_callback,
    )

    execution_time = time.time() - start_time

    await send_progress("completed", message="Research complete", progress=1.0)

    logger.info(
        f"Research [{session_id}] complete: {len(final_report)} chars, "
        f"{len(unique_sources)} sources, {execution_time:.1f}s"
    )

    return ResearchResponse(
        session_id=session_id,
        query=query,
        report=final_report,
        sections=section_results,
        total_sources=len(unique_sources),
        execution_time=execution_time,
        search_engine_used=engine.name,
    )


__all__ = [
    "deep_research_async",
    "_generate_structure",
    "_summarize",
    "_reflect",
    "_generate_final_report",
]
