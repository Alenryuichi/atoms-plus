"""Core research logic for Deep Research functionality.

This module implements the main research pipeline:
1. Generate report structure using LLM
2. For each section:
   a. Execute initial search
   b. Summarize results using LLM
   c. Reflect and identify gaps (up to max_rounds)
   d. Execute supplementary searches if needed
3. Generate final report

All operations are async for non-blocking execution.
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
) -> str:
    """Generate technical report using two-stage generation.

    Stage 1: Decide tech stack (single LLM call)
    Stage 2: Generate 7 sections in parallel (all using the same tech stack)

    This ensures consistency across all sections while maintaining speed.

    Args:
        title: Report title
        sections: List of section results from research
        all_sources: All cited sources
    """
    logger.info(f"Generating sectioned report (two-stage): {title}")
    start_time = time.time()

    # Combine all section content
    combined_content = "\n\n".join(f"### {s.title}\n{s.content}" for s in sections)

    # =========================================================================
    # Stage 1: Decide tech stack
    # =========================================================================
    tech_stack = await _decide_tech_stack(title, combined_content)
    stage1_time = time.time() - start_time
    logger.info(f"Stage 1 completed in {stage1_time:.1f}s")

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
    # Assemble report
    # =========================================================================
    report_parts = [f"# {title}\n"]

    # Add tech stack summary at the top
    report_parts.append(
        f"\n> **锁定技术栈**: {tech_stack.split('总结:')[-1].strip()}\n"
    )

    for i, (section_name, _) in enumerate(section_tasks):
        result = results[i]
        if isinstance(result, Exception):
            logger.warning(f"Section '{section_name}' failed: {result}")
            report_parts.append(
                f"\n\n<!-- Section {section_name} generation failed -->\n"
            )
        else:
            report_parts.append(f"\n\n{result}")

    # Add sources
    sources_text = "\n".join(f"- {url}" for url in all_sources[:20])
    report_parts.append(f"\n\n## 参考来源\n{sources_text}")

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
) -> str:
    """Generate final Markdown report.

    For BUILD_APP intent, uses parallel sectioned generation for faster results.
    For other intents, uses single-shot generation.

    Args:
        title: Report title
        sections: List of section results
        all_sources: All cited sources
        intent: User intent type (BUILD_APP uses parallel sectioned generation)
    """
    logger.info(f"Generating final report: {title} (intent={intent})")

    # Use parallel sectioned generation for BUILD_APP
    if intent == IntentType.BUILD_APP:
        return await _generate_final_report_sectioned(title, sections, all_sources)

    # For other intents, use single-shot generation
    sections_content = "\n\n".join(f"### {s.title}\n{s.content}" for s in sections)
    sources = "\n".join(f"- {url}" for url in all_sources[:20])

    prompt = FINAL_REPORT_PROMPT.format(
        title=title,
        sections_content=sections_content,
        sources=sources,
    )
    # Use longer timeout for final report (large prompt + long output)
    return await _call_llm(prompt, timeout=600)


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
    all_sources: list[str] = []
    section_results: list[SectionResult] = []

    logger.info(f"Starting research [{session_id}]: {query}")

    # Initialize search engine
    engine: SearchEngine = get_search_engine(search_engine)

    # Helper to send progress
    async def send_progress(event: str, **kwargs):
        if on_progress:
            await on_progress(
                ResearchProgress(event=event, session_id=session_id, **kwargs)
            )

    await send_progress("started", message=f"Starting research: {query}")

    # Step 0: Query Rewrite (convert vague input to specific queries)
    rewritten: RewrittenQuery | None = None
    if enable_query_rewrite:
        await send_progress(
            "rewriting", message="Analyzing intent and rewriting query..."
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
            data={
                "intent": rewritten.intent.value,
                "dimensions": rewritten.research_dimensions,
                "queries": rewritten.search_queries[:5],  # Preview first 5
            },
        )
        # Use context_summary as the refined query for structure generation
        query = rewritten.context_summary

    # Step 1: Generate report structure (use intent-specific prompt)
    intent = rewritten.intent if rewritten else None
    structure = await _generate_structure(query, intent=intent)
    total_sections = len(structure.sections)
    logger.info(f"Generated structure with {total_sections} sections (intent={intent})")

    # Step 2: Process each section
    for idx, section in enumerate(structure.sections):
        section_progress = (idx + 1) / total_sections

        await send_progress(
            "section_started",
            current_section=section.title,
            current_round=0,
            total_sections=total_sections,
            progress=section_progress * 0.9,
        )

        # Build search queries for this section
        # Combine section's query with rewritten queries (if available)
        section_queries = [section.search_query]
        if rewritten and rewritten.search_queries:
            # Find related rewritten queries for this section
            section_keywords = section.title.lower().split()
            for rq in rewritten.search_queries:
                rq_lower = rq.lower()
                if any(kw in rq_lower for kw in section_keywords):
                    section_queries.append(rq)
            # Limit to 3 queries per section
            section_queries = section_queries[:3]

        # Initial search with multiple queries
        all_results: list[SearchResult] = []
        for sq in section_queries:
            await send_progress("searching", message=f"Searching: {sq}")
            results = await engine.search(sq, max_results=3)
            all_results.extend(results)
        search_queries = section_queries.copy()

        # Deduplicate by URL
        seen_urls = set()
        unique_results: list[SearchResult] = []
        for r in all_results:
            if r.url and r.url not in seen_urls:
                seen_urls.add(r.url)
                unique_results.append(r)
        results = unique_results[:8]  # Limit to 8 results per section

        # Collect sources
        section_sources = [r.url for r in results if r.url]
        all_sources.extend(section_sources)

        # Summarize
        await send_progress("summarizing", message=f"Summarizing: {section.title}")
        summary = await _summarize(results, section.title)

        # Reflection loop
        for round_num in range(max_rounds):
            await send_progress(
                "reflecting",
                current_round=round_num + 1,
                message=f"Reflecting (round {round_num + 1}/{max_rounds})",
            )

            gap_query = await _reflect(summary, section.title)

            if gap_query == "COMPLETE":
                logger.info(
                    f"Section '{section.title}' complete after {round_num + 1} rounds"
                )
                break

            # Supplementary search
            logger.info(f"Gap identified: {gap_query}")
            search_queries.append(gap_query)
            additional_results = await engine.search(gap_query, max_results=3)
            all_sources.extend([r.url for r in additional_results if r.url])

            # Re-summarize with additional results
            summary = await _summarize(results + additional_results, section.title)

        # Store section result
        section_results.append(
            SectionResult(
                title=section.title,
                content=summary,
                sources=section_sources,
                search_queries=search_queries,
            )
        )

        await send_progress(
            "section_completed",
            current_section=section.title,
            progress=section_progress * 0.9,
        )

    # Step 3: Generate final report (use intent-specific prompt)
    await send_progress(
        "generating_report", message="Generating final report", progress=0.95
    )
    unique_sources = list(dict.fromkeys(all_sources))  # Deduplicate
    final_report = await _generate_final_report(
        structure.title, section_results, unique_sources, intent=intent
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
