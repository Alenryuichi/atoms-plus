# Deep Research Module - Agent Development Guide

## Overview

Multi-round search + LLM synthesis pipeline that generates technical implementation guides.
Supports intent detection, query rewriting, and two-stage parallel generation.

## Architecture

```
User Query: "我要做一个电商网站"
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 0: Query Rewrite (query_rewriter.py)                  │
│   - Intent Detection → BUILD_APP                            │
│   - Dimension Decomposition → [技术栈, 数据库, 功能, ...]    │
│   - Multi-Query Generation → 25 search queries              │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 1: Search + Summarize (research.py)                   │
│   - Execute searches via DashScope/Tavily                   │
│   - LLM summarize each dimension                            │
│   - Reflect and identify gaps (up to max_rounds)            │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 2: Two-Stage Report Generation                        │
│                                                             │
│   Stage 2a: _decide_tech_stack() [SERIAL]                   │
│     - Lock primary tech stack (e.g., Next.js + PostgreSQL)  │
│                                                             │
│   Stage 2b: asyncio.gather() [PARALLEL]                     │
│     - 7 sections with {tech_stack} constraint injected      │
│     - TECH_SECTION_QUICK_START, _STACK, _DATABASE, ...      │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
Output: 25K+ char Markdown report with consistent tech stack
```

## File Structure

| File | Responsibility |
|------|----------------|
| `research.py` | Main pipeline: `deep_research_async()`, two-stage generation |
| `query_rewriter.py` | Intent detection, query decomposition, multi-query generation |
| `search.py` | Search engine abstraction: `TavilySearch`, `DashScopeSearch` |
| `prompts.py` | All LLM prompt templates (STRUCTURE, SUMMARIZE, TECH_SECTION_*) |
| `models.py` | Pydantic models: `ResearchRequest`, `ResearchResponse`, etc. |
| `api.py` | FastAPI router: `POST /research`, `WS /research/stream` |

## Key Functions

### Entry Point

```python
async def deep_research_async(
    query: str,                    # User input (can be vague)
    max_rounds: int = 2,           # Reflection rounds per section
    search_engine: str = "auto",   # "auto" | "tavily" | "dashscope"
    language: str = "auto",        # "auto" | "en" | "zh"
    enable_query_rewrite: bool = True,
    on_progress: Callable | None = None,  # WebSocket streaming
) -> ResearchResponse
```

### Internal Pipeline

```python
# Query Rewrite
async def rewrite_query(user_input: str) -> RewrittenQuery

# Structure Generation
async def _generate_structure(query: str, intent: IntentType) -> ReportStructure

# Search + Summarize
async def _summarize(results: list[SearchResult], topic: str) -> str
async def _reflect(summary: str, topic: str) -> str  # Returns "COMPLETE" or gap query

# Two-Stage Report (BUILD_APP only)
async def _decide_tech_stack(title: str, content: str) -> str
async def _generate_section_parallel(title, content, tech_stack, template) -> str
async def _generate_final_report_sectioned(title, sections, sources) -> str
```

## Environment Variables

### Required

```bash
LLM_API_KEY=sk-xxx          # LiteLLM API key
LLM_BASE_URL=https://...    # LiteLLM base URL
LLM_MODEL=openai/MiniMax-M2.5  # Model with openai/ prefix
```

### Search Engine (at least one required)

```bash
DASHSCOPE_API_KEY=sk-xxx    # DashScope (Chinese queries)
TAVILY_API_KEY=tvly-xxx     # Tavily (English queries)
```

### Optional

```bash
LLM_TIMEOUT=120             # Default timeout (seconds)
```

## Intent Types

| Intent | Trigger Keywords | Report Style |
|--------|------------------|--------------|
| `BUILD_APP` | "做一个", "开发", "构建" | Two-stage tech guide |
| `LEARN_TECH` | "什么是", "如何理解" | Educational report |
| `SOLVE_BUG` | "报错", "不工作" | Troubleshooting guide |
| `COMPARE` | "vs", "选择...还是" | Comparison table |
| `RESEARCH` | "现状", "趋势" | Standard research report |

**Note**: Only `BUILD_APP` triggers two-stage parallel generation.

## Two-Stage Generation Details

### Stage 1: Tech Stack Decision

```python
# prompts.py: TECH_STACK_DECISION
# Input: Combined research summaries
# Output: Locked tech stack string (e.g., "Next.js 14 + PostgreSQL + Vercel")
```

### Stage 2: Parallel Section Generation

```python
# 7 sections generated in parallel with {tech_stack} injected:
TECH_SECTION_QUICK_START   # Bash commands + setup table
TECH_SECTION_STACK         # Framework comparison
TECH_SECTION_DATABASE      # Prisma schema + ER diagram
TECH_SECTION_FEATURES      # Core feature code snippets
TECH_SECTION_INTEGRATIONS  # Third-party SDK integration
TECH_SECTION_DEPLOYMENT    # CI/CD + Vercel/Railway config
TECH_SECTION_CHECKLIST     # Day-by-day implementation plan
```

## Search Engine Selection

```python
def get_search_engine(preference: str = "auto") -> SearchEngine:
    # Priority: user preference > available API keys
    # DashScope: OpenAI-compatible endpoint with enable_search=True
    # Tavily: Structured results with URLs
```

### DashScope Notes

- Endpoint: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- `enable_search=True` returns synthesized text, not structured URLs
- URLs extracted from content using regex: `r'https?://[^\s<>"\')\]，。、]+'`

## Common Issues and Solutions

### 1. Stack Drift (技术栈不一致)

**Symptom**: Section 1 recommends Vue, Section 3 uses React hooks
**Cause**: Parallel sections generated without shared context
**Solution**: Two-stage generation with `_decide_tech_stack()` in Stage 1

### 2. Timeout on Long Reports

**Symptom**: `ReadTimeout` after 120 seconds
**Cause**: Single LLM call generating 10K+ chars
**Solution**: Sectioned parallel generation (7 × 180s instead of 1 × 600s)

### 3. Missing Source Attribution

**Symptom**: `total_sources: 0` in response
**Cause**: DashScope doesn't return structured URLs
**Solution**: Regex extraction from LLM content + fallback to DashScope attribution

### 4. API 400 Errors

**Symptom**: `invalid_parameter_error` from DashScope
**Cause**: Using old API format (`input.messages`) instead of OpenAI format
**Solution**: Use `/compatible-mode/v1/chat/completions` with `messages` array

## E2E Test Commands

### Quick Test (1 round, ~2 min)

```bash
cd /path/to/atoms-plus
export LLM_API_KEY=sk-xxx
export LLM_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
export LLM_MODEL=openai/MiniMax-M2.5
export DASHSCOPE_API_KEY=sk-xxx

poetry run python -c "
import asyncio
from atoms_plus.deep_research import deep_research_async

async def test():
    result = await deep_research_async('我要做一个电商网站', max_rounds=1)
    print(f'Report: {len(result.report)} chars')
    print(f'Sources: {result.total_sources}')
    print(f'Time: {result.execution_time:.1f}s')

asyncio.run(test())
"
```

### Full Test with Output

```bash
poetry run python -c "
import asyncio
from atoms_plus.deep_research import deep_research_async
from pathlib import Path

async def main():
    result = await deep_research_async('我要做一个电商网站', max_rounds=2)
    Path('test_report.md').write_text(result.report)
    print(f'Saved: test_report.md ({len(result.report)} chars)')

asyncio.run(main())
"
```

### Search Engine Test

```bash
poetry run python -c "
import asyncio
from atoms_plus.deep_research.search import DashScopeSearch

async def test():
    engine = DashScopeSearch()
    results = await engine.search('Next.js ecommerce best practices')
    print(f'Results: {len(results)}')
    for r in results:
        print(f'  - {r.url}')

asyncio.run(test())
"
```

## API Endpoints

### REST

```
POST /api/v1/research
Content-Type: application/json

{
    "query": "我要做一个电商网站",
    "max_rounds": 2,
    "search_engine": "auto",
    "language": "auto"
}
```

### WebSocket

```
WS /api/v1/research/stream

# Send:
{"query": "...", "max_rounds": 2}

# Receive events:
{"event": "started", "session_id": "abc123", "progress": 0.0}
{"event": "rewriting", "message": "Analyzing intent..."}
{"event": "section_started", "current_section": "技术栈", "progress": 0.2}
...
{"event": "result", "report": "# ...", "total_sources": 10}
```

## Extending the Module

### Adding New Intent Type

1. Add to `IntentType` enum in `query_rewriter.py`
2. Add detection keywords in `INTENT_ANALYSIS_PROMPT`
3. Create decomposition prompt (e.g., `DECOMPOSITION_PROMPT_NEW`)
4. Handle in `_generate_structure()` and `_generate_final_report()`

### Adding New Search Engine

1. Create class extending `SearchEngine` in `search.py`
2. Implement `name` property and `search()` method
3. Add to `get_search_engine()` factory function
4. Set env var check in constructor

### Adding New Report Section

1. Create prompt template in `prompts.py` (e.g., `TECH_SECTION_NEW`)
2. Add to `section_tasks` list in `_generate_final_report_sectioned()`
3. Ensure prompt includes `{tech_stack}` placeholder for consistency

