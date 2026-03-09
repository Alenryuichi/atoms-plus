# Deep Research 集成方案 (V1 架构)

> 将 DeepSearchAgent 的多轮搜索+反思机制集成到 Atoms Plus V1 架构中

## 1. 概述

### 1.1 目标

提供深度研究功能，通过 REST API 和 WebSocket 供前端和 Agent 调用，执行多轮搜索、总结和反思，生成高质量的研究报告。

### 1.2 核心特性

- **多轮搜索**：对每个研究主题进行多次迭代搜索
- **LLM 反思**：识别信息缺口，自动补充搜索
- **结构化输出**：生成带来源的 Markdown 格式报告
- **V1 架构兼容**：遵循 atoms_plus 现有模块模式 (team_mode, race_mode, scaffolding)
- **双搜索引擎**：支持 Tavily MCP (默认) 和 DashScope WebSearch

### 1.3 ⚠️ 架构说明

**重要**: 本方案遵循 V1 架构，不使用 V0 代码：

| ❌ 不使用 (V0 - 将于 2026-04-01 删除) | ✅ 使用 (V1 - Atoms Plus 扩展) |
|--------------------------------------|-------------------------------|
| `openhands/agenthub/codeact_agent/` | `atoms_plus/deep_research/` |
| `openhands/runtime/plugins/agent_skills/` | FastAPI Router + WebSocket |
| `function_calling.py` | REST API / Agent Server 调用 |

## 2. 架构设计

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                   DeepResearch V1 集成架构 (Atoms Plus)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         atoms_plus/atoms_server.py                       │   │
│  │                                                                          │   │
│  │  base_app.include_router(race_router, prefix='/api/v1')                  │   │
│  │  base_app.include_router(roles_router)                                   │   │
│  │  base_app.include_router(scaffolding_router, prefix='/api/v1')           │   │
│  │  base_app.include_router(team_router)                                    │   │
│  │  base_app.include_router(deep_research_router, prefix='/api/v1') ◄─ 新增  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│           ┌───────────────────────────┼───────────────────────────┐            │
│           │                           │                           │            │
│           ▼                           ▼                           ▼            │
│  ┌─────────────────┐      ┌─────────────────────┐      ┌─────────────────┐    │
│  │  REST API       │      │  WebSocket Stream   │      │  Team Mode      │    │
│  │  /research      │      │  /research/stream   │      │  Integration    │    │
│  │  同步请求返回报告 │      │  实时流式输出       │      │  作为 Researcher │    │
│  └────────┬────────┘      └─────────┬───────────┘      └────────┬────────┘    │
│           │                         │                           │             │
│           └─────────────────────────┼───────────────────────────┘             │
│                                     │                                          │
│                                     ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                     atoms_plus/deep_research/                             │  │
│  │                                                                          │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐  │  │
│  │  │ api.py      │   │ research.py │   │ prompts.py  │   │ search.py   │  │  │
│  │  │ FastAPI     │   │ 核心逻辑     │   │ LLM 提示词  │   │ 搜索封装     │  │  │
│  │  │ 路由+模型    │   │ 搜索-总结-   │   │ 结构生成    │   │ Tavily/     │  │  │
│  │  │             │   │ 反思循环     │   │ 总结/反思   │   │ DashScope   │  │  │
│  │  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘  │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                          │
│                    ┌────────────────┼────────────────┐                        │
│                    │                │                │                        │
│                    ▼                ▼                ▼                        │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │  Tavily MCP         │  │  DashScope MCP      │  │  LiteLLM            │   │
│  │  (默认, 英文优)      │  │  (中文优)           │  │  (总结/反思)         │   │
│  │  tavily-mcp@0.2.1   │  │  WebSearch API      │  │  qwen-plus 等       │   │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 3. 技术选型

### 3.1 为什么选择 FastAPI Router 方案？

| 方案 | V1 兼容 | 优点 | 缺点 | 选择 |
|------|---------|------|------|------|
| **FastAPI Router** | ✅ | 与 atoms_plus 其他模块一致 | 需要前端调用 | ✅ |
| Agent Skills + IPython | ❌ V0 | 复用 Jupyter | V0 代码，即将删除 | ❌ |
| **新 Action 类型** | ❌ V0 | 原生集成 | V0 代码，即将删除 | ❌ |
| MCP Tool | ✅ | 完全解耦 | 配置复杂，默认禁用 | ⚠️ 备选 |

### 3.2 搜索服务选择

支持两种搜索引擎，自动选择：

| 搜索引擎 | 适用场景 | 配置 |
|----------|----------|------|
| **Tavily** (默认) | 英文搜索、技术文档 | `TAVILY_API_KEY` |
| **DashScope WebSearch** | 中文搜索、国内资讯 | `DASHSCOPE_API_KEY` |

```python
# 自动选择逻辑
def get_search_engine():
    if os.getenv('TAVILY_API_KEY'):
        return TavilySearch()
    elif os.getenv('DASHSCOPE_API_KEY'):
        return DashScopeSearch()
    else:
        raise ValueError("No search API key configured")
```

## 4. 文件结构

```
atoms_plus/
├── deep_research/                    # 新增模块 (V1 架构)
│   ├── __init__.py                   # 导出 deep_research 函数和 router
│   ├── api.py                        # FastAPI 路由 + WebSocket
│   ├── models.py                     # Pydantic 模型
│   ├── research.py                   # 核心研究逻辑
│   ├── search.py                     # 搜索引擎封装 (Tavily/DashScope)
│   └── prompts.py                    # LLM 提示词
│
├── atoms_server.py                   # 修改: 注册 deep_research_router
├── team_mode/                        # 现有: 可集成 Researcher 角色
└── ...
```

## 5. 核心流程

### 5.1 深度研究流程

```
┌──────────────────────────────────────────────────────────────────┐
│                    深度研究执行流程                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 生成报告结构 (LLM)                                           │
│     ├── 输入: 用户查询 "2025年AI发展趋势"                         │
│     └── 输出: 报告大纲 (3-5个章节)                               │
│                                                                  │
│  2. 对每个章节执行迭代循环:                                       │
│     ┌─────────────────────────────────────────────────────┐     │
│     │  for section in sections:                            │     │
│     │      # 初始搜索                                       │     │
│     │      results = web_search(section.query)             │     │
│     │      summary = llm_summarize(results)                │     │
│     │                                                      │     │
│     │      # 反思循环 (最多 max_rounds 次)                   │     │
│     │      for round in range(max_rounds):                 │     │
│     │          gaps = llm_reflect(summary)                 │     │
│     │          if not gaps:                                │     │
│     │              break  # 信息完整                        │     │
│     │          additional = web_search(gaps)               │     │
│     │          summary = llm_summarize(results + additional)│     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                  │
│  3. 生成最终报告                                                 │
│     └── Markdown 格式，包含来源链接                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 调用方式 (三种场景)

#### 场景 1: 前端 UI 直接调用 (REST API)

```
User clicks "Deep Research" button
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend                                                    │
│   fetch('/api/v1/research', {                               │
│     method: 'POST',                                         │
│     body: JSON.stringify({                                  │
│       query: "2025年AI Agent发展趋势",                      │
│       max_rounds: 2                                          │
│     })                                                      │
│   })                                                        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ atoms_plus/deep_research/api.py                             │
│   @router.post("/research")                                 │
│   async def execute_research(request: ResearchRequest):     │
│       report = await deep_research(request.query, ...)      │
│       return ResearchResponse(report=report)                │
└─────────────────────────────────────────────────────────────┘
```

#### 场景 2: 实时流式输出 (WebSocket)

```
Frontend connects to WebSocket
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ const ws = new WebSocket('/api/v1/research/stream')         │
│ ws.send(JSON.stringify({ query: "AI trends 2025" }))        │
│                                                             │
│ ws.onmessage = (event) => {                                 │
│   const data = JSON.parse(event.data)                       │
│   if (data.event === 'section_complete') {                  │
│     appendToUI(data.section)                                │
│   } else if (data.event === 'completed') {                  │
│     showFinalReport(data.report)                            │
│   }                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

#### 场景 3: Team Mode 集成 (Researcher 角色)

```
Team Mode Graph: PM → Architect → Researcher → Engineer
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│ atoms_plus/team_mode/nodes/researcher.py                    │
│                                                             │
│   from atoms_plus.deep_research import deep_research_async  │
│                                                             │
│   async def researcher_node(state: TeamState) -> TeamState: │
│       # 调用深度研究                                         │
│       report = await deep_research_async(                   │
│           query=state['task'],                              │
│           max_rounds=2                                      │
│       )                                                     │
│       return {'research_report': report, ...}               │
└─────────────────────────────────────────────────────────────┘
```

## 6. 环境变量配置

```bash
# 搜索引擎 (二选一，优先使用 Tavily)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx          # 推荐: 英文搜索更好
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxx         # 备选: 中文搜索更好

# LLM 配置 (用于总结和反思) - 使用现有 OpenHands 配置
LLM_API_KEY=${LLM_API_KEY}
LLM_BASE_URL=${LLM_BASE_URL}
LLM_MODEL=${LLM_MODEL}  # 例如: openai/qwen-plus, openai/gpt-4o
```

## 7. API 设计

### 7.1 REST API 端点

```
POST /api/v1/research          - 执行深度研究 (同步，返回完整报告)
GET  /api/v1/research/sessions - 列出研究会话
GET  /api/v1/research/{id}     - 获取研究结果
WS   /api/v1/research/stream   - WebSocket 流式研究
```

### 7.2 Pydantic 模型 (models.py)

```python
from pydantic import BaseModel, Field
from enum import Enum

class SearchEngine(str, Enum):
    TAVILY = "tavily"
    DASHSCOPE = "dashscope"
    AUTO = "auto"  # 自动选择

class ResearchRequest(BaseModel):
    """深度研究请求"""
    query: str = Field(..., description="研究主题或问题")
    max_rounds: int = Field(default=2, ge=1, le=5, description="每章节最大反思轮数")
    search_engine: SearchEngine = Field(default=SearchEngine.AUTO)
    language: str = Field(default="auto", description="报告语言: auto/zh/en")

class SectionResult(BaseModel):
    """章节研究结果"""
    title: str
    content: str
    sources: list[str]
    search_queries: list[str]

class ResearchResponse(BaseModel):
    """深度研究响应"""
    session_id: str
    query: str
    report: str  # Markdown 格式完整报告
    sections: list[SectionResult]
    total_sources: int
    execution_time: float
    search_engine_used: str

class ResearchProgress(BaseModel):
    """研究进度 (WebSocket 事件)"""
    event: str  # started, section_started, section_complete, reflect, completed, error
    session_id: str
    current_section: str | None = None
    progress: float  # 0.0 - 1.0
    message: str | None = None
```

### 7.3 核心函数签名 (research.py)

```python
async def deep_research_async(
    query: str,
    max_rounds: int = 2,
    search_engine: str = "auto",
    language: str = "auto",
    on_progress: Callable[[ResearchProgress], Awaitable[None]] | None = None,
) -> ResearchResponse:
    """
    异步执行深度研究，返回结构化研究报告。

    Args:
        query: 研究主题或问题
        max_rounds: 每个章节的最大反思轮数 (默认: 2)
        search_engine: 搜索引擎选择 (tavily/dashscope/auto)
        language: 报告语言 (auto/zh/en)
        on_progress: 进度回调函数 (用于 WebSocket 流式输出)

    Returns:
        ResearchResponse: 包含完整报告和各章节详情
    """

def deep_research(query: str, max_rounds: int = 2) -> str:
    """
    同步版本 - 返回 Markdown 格式报告字符串。
    用于简单场景或测试。
    """
    import asyncio
    response = asyncio.run(deep_research_async(query, max_rounds))
    return response.report
```

## 8. 实现文件详情

### 8.1 `search.py` - 搜索引擎封装

```python
"""Search engine abstraction for Deep Research.

Supports:
- Tavily MCP (default, better for English)
- DashScope WebSearch (fallback, better for Chinese)
"""
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import httpx
from openhands.core.logger import openhands_logger as logger


@dataclass
class SearchResult:
    """Unified search result format."""
    title: str
    url: str
    snippet: str
    score: float = 0.0


class SearchEngine(ABC):
    """Abstract base class for search engines."""

    @abstractmethod
    async def search(self, query: str, max_results: int = 10) -> list[SearchResult]:
        """Execute search and return results."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Engine name for logging."""
        pass


class TavilySearch(SearchEngine):
    """Tavily search engine - recommended for English queries."""

    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")
        if not self.api_key:
            raise ValueError("TAVILY_API_KEY not configured")

    @property
    def name(self) -> str:
        return "tavily"

    async def search(self, query: str, max_results: int = 10) -> list[SearchResult]:
        """Search using Tavily API."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": self.api_key,
                    "query": query,
                    "max_results": max_results,
                    "include_answer": False,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

        results = []
        for item in data.get("results", []):
            results.append(SearchResult(
                title=item.get("title", ""),
                url=item.get("url", ""),
                snippet=item.get("content", ""),
                score=item.get("score", 0.0),
            ))
        return results


class DashScopeSearch(SearchEngine):
    """DashScope WebSearch - better for Chinese queries."""

    def __init__(self):
        self.api_key = os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY not configured")

    @property
    def name(self) -> str:
        return "dashscope"

    async def search(self, query: str, max_results: int = 10) -> list[SearchResult]:
        """Search using DashScope WebSearch API."""
        # 使用 DashScope 兼容模式调用 WebSearch
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://dashscope.aliyuncs.com/api/v1/services/websearch/v1/search",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"query": query, "size": max_results},
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

        results = []
        for item in data.get("output", {}).get("results", []):
            results.append(SearchResult(
                title=item.get("title", ""),
                url=item.get("url", ""),
                snippet=item.get("snippet", ""),
            ))
        return results


def get_search_engine(preference: str = "auto") -> SearchEngine:
    """Get configured search engine.

    Args:
        preference: "tavily", "dashscope", or "auto"

    Returns:
        Configured SearchEngine instance
    """
    if preference == "tavily" or (preference == "auto" and os.getenv("TAVILY_API_KEY")):
        try:
            return TavilySearch()
        except ValueError:
            pass

    if preference == "dashscope" or preference == "auto":
        try:
            return DashScopeSearch()
        except ValueError:
            pass

    raise ValueError("No search engine configured. Set TAVILY_API_KEY or DASHSCOPE_API_KEY")
```

### 8.2 `prompts.py` - LLM 提示词

```python
"""LLM prompts for deep research."""

STRUCTURE_PROMPT = '''你是一个专业的研究分析师。根据用户的研究主题，生成一个结构化的报告大纲。

研究主题: {query}

请输出 JSON 格式的报告结构:
```json
{{
  "title": "报告标题",
  "sections": [
    {{
      "title": "章节标题",
      "description": "这个章节需要研究什么",
      "search_query": "用于搜索的关键词"
    }}
  ]
}}
```

要求:
- 3-5 个章节
- 每个章节聚焦一个具体方面
- search_query 应该是简洁有效的搜索关键词
'''

SUMMARIZE_PROMPT = '''你是一个专业的研究分析师。根据以下搜索结果，撰写关于"{topic}"的内容总结。

搜索结果:
{search_results}

要求:
- 综合多个来源的信息
- 提取关键事实和数据
- 保持客观中立
- 标注重要来源
'''

REFLECT_PROMPT = '''你是一个严谨的研究评审员。评估以下研究总结是否完整。

研究主题: {topic}
当前总结:
{summary}

请分析:
1. 是否有明显的信息缺口？
2. 是否需要补充搜索？

如果信息完整，输出: "COMPLETE"
如果需要补充，输出需要搜索的关键词（用于填补信息缺口）
'''
```

### 8.3 `research.py` - 核心逻辑

```python
"""Deep Research core logic with multi-round search and reflection.

V1 Architecture: Uses async patterns, avoids V0 IPython/Agent Skills.
"""
import json
import os
import time
import uuid
from typing import Awaitable, Callable

import litellm
from openhands.core.logger import openhands_logger as logger

from .models import (
    ResearchProgress,
    ResearchResponse,
    SectionResult,
)
from .prompts import STRUCTURE_PROMPT, SUMMARIZE_PROMPT, REFLECT_PROMPT
from .search import SearchResult, get_search_engine

__all__ = ['deep_research', 'deep_research_async']


async def deep_research_async(
    query: str,
    max_rounds: int = 2,
    search_engine: str = "auto",
    language: str = "auto",
    on_progress: Callable[[ResearchProgress], Awaitable[None]] | None = None,
) -> ResearchResponse:
    """
    异步执行深度研究，返回结构化研究报告。

    Args:
        query: 研究主题或问题
        max_rounds: 每个章节的最大反思轮数 (默认: 2)
        search_engine: 搜索引擎选择 (tavily/dashscope/auto)
        language: 报告语言 (auto/zh/en)
        on_progress: 进度回调函数 (用于 WebSocket 流式输出)

    Returns:
        ResearchResponse: 包含完整报告和各章节详情
    """
    session_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    engine = get_search_engine(search_engine)

    async def emit(event: str, **kwargs):
        if on_progress:
            await on_progress(ResearchProgress(
                event=event,
                session_id=session_id,
                **kwargs,
            ))

    await emit("started", message=f"Starting research: {query}")

    # 1. 生成报告结构
    structure = await _generate_structure(query, language)
    total_sections = len(structure["sections"])

    sections_results: list[SectionResult] = []
    all_sources: list[str] = []

    # 2. 对每个章节执行搜索-总结-反思循环
    for idx, section_def in enumerate(structure["sections"]):
        section_title = section_def["title"]
        search_query = section_def["search_query"]

        await emit(
            "section_started",
            current_section=section_title,
            progress=(idx / total_sections),
            message=f"Researching: {section_title}",
        )

        # 初始搜索
        results = await engine.search(search_query)
        summary = await _summarize(results, section_def["description"], language)
        sources = [r.url for r in results if r.url]

        # 反思循环
        for round_num in range(max_rounds):
            gaps = await _reflect(summary, section_def["description"], language)
            if gaps == "COMPLETE" or not gaps.strip():
                break

            await emit(
                "reflect",
                current_section=section_title,
                message=f"Round {round_num + 1}: {gaps[:50]}...",
            )

            additional = await engine.search(gaps)
            summary = await _summarize(
                results + additional,
                section_def["description"],
                language,
            )
            sources.extend([r.url for r in additional if r.url])

        sections_results.append(SectionResult(
            title=section_title,
            content=summary,
            sources=list(set(sources)),
            search_queries=[search_query, gaps] if gaps != "COMPLETE" else [search_query],
        ))
        all_sources.extend(sources)

        await emit(
            "section_complete",
            current_section=section_title,
            progress=((idx + 1) / total_sections),
        )

    # 3. 生成最终报告
    report = _format_report(query, structure["title"], sections_results, language)

    execution_time = time.time() - start_time
    await emit("completed", progress=1.0, message="Research complete")

    return ResearchResponse(
        session_id=session_id,
        query=query,
        report=report,
        sections=sections_results,
        total_sources=len(set(all_sources)),
        execution_time=execution_time,
        search_engine_used=engine.name,
    )


def deep_research(query: str, max_rounds: int = 2) -> str:
    """同步版本 - 返回 Markdown 格式报告字符串。"""
    import asyncio
    response = asyncio.run(deep_research_async(query, max_rounds))
    return response.report


async def _generate_structure(query: str, language: str) -> dict:
    """使用 LLM 生成报告结构。"""
    prompt = STRUCTURE_PROMPT.format(query=query, language=language)
    response = await litellm.acompletion(
        model=os.getenv("LLM_MODEL", "openai/qwen-plus"),
        messages=[{"role": "user", "content": prompt}],
        api_key=os.getenv("LLM_API_KEY"),
        api_base=os.getenv("LLM_BASE_URL"),
    )
    content = response.choices[0].message.content

    # 解析 JSON
    try:
        # 处理 markdown code block
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse structure JSON, using fallback")
        return {
            "title": f"Research Report: {query}",
            "sections": [
                {"title": "Overview", "description": query, "search_query": query},
            ],
        }


async def _summarize(results: list[SearchResult], topic: str, language: str) -> str:
    """使用 LLM 总结搜索结果。"""
    search_results_text = "\n\n".join([
        f"**{r.title}**\n{r.snippet}\nSource: {r.url}"
        for r in results[:10]  # 限制结果数量
    ])

    prompt = SUMMARIZE_PROMPT.format(
        topic=topic,
        search_results=search_results_text,
        language=language,
    )

    response = await litellm.acompletion(
        model=os.getenv("LLM_MODEL", "openai/qwen-plus"),
        messages=[{"role": "user", "content": prompt}],
        api_key=os.getenv("LLM_API_KEY"),
        api_base=os.getenv("LLM_BASE_URL"),
    )
    return response.choices[0].message.content


async def _reflect(summary: str, topic: str, language: str) -> str:
    """使用 LLM 反思并识别信息缺口。"""
    prompt = REFLECT_PROMPT.format(topic=topic, summary=summary, language=language)

    response = await litellm.acompletion(
        model=os.getenv("LLM_MODEL", "openai/qwen-plus"),
        messages=[{"role": "user", "content": prompt}],
        api_key=os.getenv("LLM_API_KEY"),
        api_base=os.getenv("LLM_BASE_URL"),
    )
    return response.choices[0].message.content.strip()


def _format_report(
    query: str,
    title: str,
    sections: list[SectionResult],
    language: str,
) -> str:
    """格式化为 Markdown 报告。"""
    lines = [f"# {title}", "", f"> Research query: {query}", ""]

    for i, section in enumerate(sections, 1):
        lines.append(f"## {i}. {section.title}")
        lines.append("")
        lines.append(section.content)
        lines.append("")

    # 来源汇总
    all_sources = []
    for section in sections:
        all_sources.extend(section.sources)
    unique_sources = list(set(all_sources))

    if unique_sources:
        lines.append("## Sources")
        lines.append("")
        for i, src in enumerate(unique_sources[:20], 1):
            lines.append(f"- [{i}] {src}")

    return "\n".join(lines)
```

### 8.4 `api.py` - FastAPI 路由

```python
"""Deep Research REST API and WebSocket endpoints.

V1 Architecture: FastAPI router pattern, same as team_mode/race_mode.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from openhands.core.logger import openhands_logger as logger

from .models import ResearchRequest, ResearchResponse, ResearchProgress
from .research import deep_research_async

router = APIRouter(prefix="/research", tags=["Deep Research"])


@router.post("", response_model=ResearchResponse)
async def execute_research(request: ResearchRequest) -> ResearchResponse:
    """执行深度研究 (同步返回完整报告)。"""
    try:
        return await deep_research_async(
            query=request.query,
            max_rounds=request.max_rounds,
            search_engine=request.search_engine.value,
            language=request.language,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Research failed: {e}")
        raise HTTPException(status_code=500, detail="Research execution failed")


@router.websocket("/stream")
async def research_stream(websocket: WebSocket):
    """WebSocket 流式研究 (实时进度更新)。"""
    await websocket.accept()

    try:
        # 接收研究请求
        data = await websocket.receive_json()
        request = ResearchRequest(**data)

        async def send_progress(progress: ResearchProgress):
            await websocket.send_json(progress.model_dump())

        # 执行研究并流式输出
        result = await deep_research_async(
            query=request.query,
            max_rounds=request.max_rounds,
            search_engine=request.search_engine.value,
            language=request.language,
            on_progress=send_progress,
        )

        # 发送最终结果
        await websocket.send_json({
            "event": "result",
            "data": result.model_dump(),
        })

    except WebSocketDisconnect:
        logger.info("Client disconnected from research stream")
    except Exception as e:
        logger.error(f"WebSocket research error: {e}")
        await websocket.send_json({
            "event": "error",
            "message": str(e),
        })
    finally:
        await websocket.close()


@router.get("/sessions")
async def list_sessions():
    """列出研究会话 (未来扩展: 持久化会话)。"""
    return {"sessions": [], "message": "Session persistence not yet implemented"}
```

## 9. 实施计划

| 阶段 | 任务 | 预估时间 | 状态 |
|------|------|----------|------|
| 1 | 创建 `atoms_plus/deep_research/` 目录结构 | 5 min | ⏳ |
| 2 | 实现 `models.py` (Pydantic 模型) | 10 min | ⏳ |
| 3 | 实现 `search.py` (Tavily/DashScope 封装) | 20 min | ⏳ |
| 4 | 实现 `prompts.py` (LLM 提示词) | 10 min | ⏳ |
| 5 | 实现 `research.py` (核心逻辑) | 30 min | ⏳ |
| 6 | 实现 `api.py` (FastAPI 路由) | 15 min | ⏳ |
| 7 | 更新 `atoms_server.py` 注册路由 | 5 min | ⏳ |
| 8 | 单元测试 | 20 min | ⏳ |
| 9 | E2E 测试 | 15 min | ⏳ |
| **总计** | | **~2 小时** | |

## 10. 测试计划

### 10.1 单元测试

```python
# tests/unit/atoms_plus/test_deep_research.py
import pytest
from unittest.mock import AsyncMock, patch

from atoms_plus.deep_research.search import TavilySearch, DashScopeSearch, get_search_engine
from atoms_plus.deep_research.research import deep_research_async


@pytest.fixture
def mock_tavily_response():
    return {
        "results": [
            {"title": "Test", "url": "https://example.com", "content": "Test content"}
        ]
    }


@pytest.mark.asyncio
async def test_tavily_search(mock_tavily_response):
    """测试 Tavily 搜索。"""
    with patch.dict("os.environ", {"TAVILY_API_KEY": "test-key"}):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_post.return_value.json.return_value = mock_tavily_response
            mock_post.return_value.raise_for_status = lambda: None

            engine = TavilySearch()
            results = await engine.search("AI trends 2025")

            assert len(results) == 1
            assert results[0].title == "Test"


@pytest.mark.asyncio
async def test_get_search_engine_priority():
    """测试搜索引擎优先级选择。"""
    with patch.dict("os.environ", {"TAVILY_API_KEY": "key1", "DASHSCOPE_API_KEY": "key2"}):
        engine = get_search_engine("auto")
        assert engine.name == "tavily"  # Tavily 优先


@pytest.mark.asyncio
async def test_deep_research_flow():
    """测试完整研究流程。"""
    with patch("atoms_plus.deep_research.research.get_search_engine") as mock_engine:
        with patch("atoms_plus.deep_research.research.litellm.acompletion") as mock_llm:
            # Mock search
            mock_search = AsyncMock()
            mock_search.search.return_value = []
            mock_search.name = "mock"
            mock_engine.return_value = mock_search

            # Mock LLM
            mock_llm.return_value.choices = [
                type("Choice", (), {"message": type("Msg", (), {"content": '{"title": "Test", "sections": []}'})})()
            ]

            result = await deep_research_async("test query", max_rounds=1)
            assert result.session_id is not None
```

### 10.2 集成测试 (E2E)

```bash
# 启动本地环境后测试 REST API
curl -X POST http://localhost:3000/api/v1/research \
  -H "Content-Type: application/json" \
  -d '{"query": "2025年AI Agent发展趋势", "max_rounds": 2}'

# 测试 WebSocket 流式输出
wscat -c ws://localhost:3000/api/v1/research/stream
# 然后发送: {"query": "AI trends 2025", "max_rounds": 1}
```

## 11. E2E 测试工具

> 基于 V1 架构设计测试，不依赖 V0 的 Agent Skills 或 IPython。

### 11.1 测试架构概述

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Deep Research E2E 测试架构 (V1)                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  tests/unit/atoms_plus/                                                         │
│  ├── test_deep_research_search.py      # 搜索引擎单元测试                        │
│  ├── test_deep_research_research.py    # 核心逻辑单元测试                        │
│  └── test_deep_research_api.py         # API 端点单元测试                        │
│                                                                                 │
│  tests/integration/                                                             │
│  └── test_deep_research_e2e.py         # 完整流程 E2E 测试                       │
│                                                                                 │
│  .claude/skills/                                                                │
│  └── deep-research-e2e-test/SKILL.md   # E2E 测试技能                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 单元测试

#### `tests/unit/atoms_plus/test_deep_research_api.py`

```python
"""
Unit tests for Deep Research API endpoints.

Run with:
    PYTHONPATH=".:$PYTHONPATH" poetry run pytest tests/unit/atoms_plus/test_deep_research_api.py -v
"""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from atoms_plus.deep_research.api import router
from atoms_plus.deep_research.models import ResearchResponse, SectionResult


@pytest.fixture
def mock_research_response():
    return ResearchResponse(
        session_id="test123",
        query="AI trends 2025",
        report="# Test Report\n\n## Section 1\nContent...",
        sections=[
            SectionResult(
                title="Section 1",
                content="Content...",
                sources=["https://example.com"],
                search_queries=["AI 2025"],
            )
        ],
        total_sources=1,
        execution_time=5.0,
        search_engine_used="tavily",
    )


class TestDeepResearchAPI:
    """Test Deep Research API endpoints."""

    @pytest.mark.asyncio
    async def test_execute_research_success(self, mock_research_response):
        """Test successful research execution."""
        with patch("atoms_plus.deep_research.api.deep_research_async") as mock_fn:
            mock_fn.return_value = mock_research_response

            # Simulate FastAPI TestClient would work
            from fastapi import FastAPI
            app = FastAPI()
            app.include_router(router, prefix="/api/v1")

            client = TestClient(app)
            response = client.post(
                "/api/v1/research",
                json={"query": "AI trends", "max_rounds": 2},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["session_id"] == "test123"
            assert "report" in data

    def test_invalid_request(self):
        """Test invalid request handling."""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(router, prefix="/api/v1")

        client = TestClient(app)
        response = client.post(
            "/api/v1/research",
            json={"max_rounds": 2},  # missing required 'query'
        )

        assert response.status_code == 422  # Validation error
```

### 11.3 集成测试

#### `tests/integration/test_deep_research_e2e.py`

```python
"""
E2E: Deep Research Complete Flow Test (V1 Architecture)

This test verifies:
1. Search engine integration (Tavily/DashScope)
2. LLM-based structure generation
3. Search-Summarize-Reflect cycle
4. Final report quality

Prerequisites:
- TAVILY_API_KEY or DASHSCOPE_API_KEY
- LLM_API_KEY, LLM_BASE_URL, LLM_MODEL

Run with:
    PYTHONPATH=".:$PYTHONPATH" poetry run pytest tests/integration/test_deep_research_e2e.py -v -s
"""
import os
import pytest


def check_search_api_available() -> bool:
    """Check if any search API is available."""
    return bool(os.environ.get('TAVILY_API_KEY') or os.environ.get('DASHSCOPE_API_KEY'))


def check_llm_api_available() -> bool:
    """Check if LLM API is available."""
    return bool(os.environ.get('LLM_API_KEY'))


@pytest.mark.integration
class TestDeepResearchE2E:
    """E2E tests for Deep Research flow."""

    @pytest.mark.asyncio
    @pytest.mark.skipif(not check_search_api_available(), reason='No search API key')
    async def test_search_engine_connection(self):
        """Test search engine connectivity."""
        from atoms_plus.deep_research.search import get_search_engine

        engine = get_search_engine("auto")
        results = await engine.search("AI Agent 2025", max_results=3)

        assert len(results) > 0, "Should return search results"
        assert all(r.url for r in results), "Results should have URLs"

        print(f"✅ Search engine '{engine.name}': {len(results)} results")
        for r in results[:3]:
            print(f"   - {r.title[:50]}...")

    @pytest.mark.asyncio
    @pytest.mark.skipif(
        not (check_search_api_available() and check_llm_api_available()),
        reason='Missing API keys'
    )
    async def test_complete_research_flow(self):
        """Test complete research flow end-to-end."""
        from atoms_plus.deep_research.research import deep_research_async

        progress_events = []

        async def capture_progress(event):
            progress_events.append(event)
            print(f"   📍 {event.event}: {event.message or event.current_section}")

        result = await deep_research_async(
            query="AI Agent development trends in 2025",
            max_rounds=1,  # Limit rounds for faster test
            on_progress=capture_progress,
        )

        # Verify result
        assert result.session_id, "Should have session ID"
        assert result.report, "Should have report"
        assert len(result.report) > 500, "Report should be substantial"
        assert result.total_sources > 0, "Should have sources"

        # Verify progress events
        event_types = [e.event for e in progress_events]
        assert "started" in event_types
        assert "completed" in event_types

        print(f"\n✅ Research complete:")
        print(f"   - Session: {result.session_id}")
        print(f"   - Sections: {len(result.sections)}")
        print(f"   - Sources: {result.total_sources}")
        print(f"   - Time: {result.execution_time:.1f}s")
        print(f"   - Engine: {result.search_engine_used}")

    def test_report_quality_validation(self):
        """Test report quality checks."""
        sample_report = """
# 2025年AI发展趋势研究报告

> Research query: AI trends 2025

## 1. 大语言模型发展

大语言模型在2025年将继续快速发展，主要体现在以下方面...

## 2. AI Agent 技术

AI Agent 作为2025年的重要趋势，正在从实验室走向生产环境...

## Sources

- [1] https://example.com/source1
- [2] https://example.com/source2
"""
        checks = self._validate_report_quality(sample_report)

        passed = sum(checks.values())
        total = len(checks)

        print(f"\n📊 Report Quality: {passed}/{total} checks")
        for check, result in checks.items():
            status = '✅' if result else '❌'
            print(f"   {status} {check}")

        assert passed >= total * 0.8, f"Report quality too low: {passed}/{total}"

    def _validate_report_quality(self, report: str) -> dict:
        """Validate generated report quality."""
        return {
            'Has Title': report.strip().startswith('#'),
            'Has Sections': report.count('## ') >= 2,
            'Has Sources': 'http' in report or 'Sources' in report,
            'Has URLs': 'http' in report,
            'Minimum Length': len(report) > 1000,
            'No Empty Sections': '##\n\n##' not in report,
        }


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
```

### 11.4 API 端点测试

```bash
# 测试 REST API
curl -X POST http://localhost:3000/api/v1/research \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI Agent development trends 2025",
    "max_rounds": 2,
    "search_engine": "auto",
    "language": "en"
  }'

# 预期响应
{
  "session_id": "abc12345",
  "query": "AI Agent development trends 2025",
  "report": "# AI Agent Development Trends 2025...",
  "sections": [...],
  "total_sources": 15,
  "execution_time": 45.2,
  "search_engine_used": "tavily"
}
```

### 11.5 新增 Skill 文件

#### `.claude/skills/deep-research-e2e-test/SKILL.md`

```markdown
---
name: deep-research-e2e-test
description: E2E testing for Deep Research flow (V1 Architecture). Use when testing search engine connection, report generation, or debugging the complete Deep Research pipeline.
---

# Deep Research E2E Test (V1 Architecture)

End-to-end testing suite for the Deep Research feature in Atoms Plus V1 architecture.

## Test Files

| File | Type | Purpose |
|------|------|---------|
| `tests/unit/atoms_plus/test_deep_research_*.py` | Unit | 单元测试 |
| `tests/integration/test_deep_research_e2e.py` | Integration | 完整流程 E2E |

## Quick Start

### Run Unit Tests

```bash
# Run all Deep Research unit tests
PYTHONPATH=".:$PYTHONPATH" poetry run pytest tests/unit/atoms_plus/test_deep_research_*.py -v

# Run specific test
PYTHONPATH=".:$PYTHONPATH" poetry run pytest tests/unit/atoms_plus/test_deep_research_api.py -v
```

### Run Integration Tests

```bash
# Set API keys (choose one search engine)
export TAVILY_API_KEY=tvly-xxx      # Recommended
# OR
export DASHSCOPE_API_KEY=sk-xxx     # Alternative

# Set LLM config (use existing OpenHands config)
export LLM_API_KEY=sk-xxx
export LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
export LLM_MODEL=openai/qwen-plus

# Run integration tests
PYTHONPATH=".:$PYTHONPATH" poetry run pytest tests/integration/test_deep_research_e2e.py -v -s --timeout=300
```

### Quick Manual Test

```bash
# Test search engine
PYTHONPATH=".:$PYTHONPATH" poetry run python -c "
import asyncio
from atoms_plus.deep_research.search import get_search_engine

async def test():
    engine = get_search_engine('auto')
    results = await engine.search('AI Agent 2025', max_results=3)
    print(f'Engine: {engine.name}')
    for r in results:
        print(f'  - {r.title[:50]}...')

asyncio.run(test())
"

# Test full research
PYTHONPATH=".:$PYTHONPATH" poetry run python -c "
import asyncio
from atoms_plus.deep_research import deep_research_async

async def test():
    result = await deep_research_async('AI trends 2025', max_rounds=1)
    print(f'Report: {len(result.report)} chars')
    print(f'Sections: {len(result.sections)}')
    print(f'Sources: {result.total_sources}')
    print(f'Time: {result.execution_time:.1f}s')

asyncio.run(test())
"
```

## Test Coverage (V1)

```
用户请求 → REST API → 搜索引擎 → LLM总结 → LLM反思 → 报告生成 → 响应
   ✅         ✅          ✅         ✅        ✅         ✅       ✅
```

| Component | Test File | Coverage |
|-----------|-----------|----------|
| Search Engines | `test_deep_research_search.py` | Tavily, DashScope |
| Core Logic | `test_deep_research_research.py` | Structure, Summarize, Reflect |
| REST API | `test_deep_research_api.py` | POST /research |
| WebSocket | `test_deep_research_api.py` | /research/stream |
| E2E Flow | `test_deep_research_e2e.py` | 完整流程 |

## Report Quality Checks

| Check | Description |
|-------|-------------|
| Has Title | Report starts with `#` |
| Has Sections | At least 2 `##` sections |
| Has Sources | Contains URLs or Sources section |
| Minimum Length | > 1000 characters |
| No Empty Sections | No `##\n\n##` pattern |

**Pass threshold**: 80% checks

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TAVILY_API_KEY` | 🟡 | Tavily search API (recommended) |
| `DASHSCOPE_API_KEY` | 🟡 | DashScope search API (fallback) |
| `LLM_API_KEY` | ✅ | LLM API key for summarization |
| `LLM_BASE_URL` | ✅ | LLM API base URL |
| `LLM_MODEL` | ✅ | LLM model name |

> 🟡 = 至少需要一个搜索引擎 API key

## Troubleshooting

### No Search Engine Configured

```
ValueError: No search engine configured. Set TAVILY_API_KEY or DASHSCOPE_API_KEY
```

**Solution**: Set at least one search API key in environment.

### LLM API Error

```
litellm.exceptions.APIError: ...
```

**Solution**:
1. Check LLM_API_KEY, LLM_BASE_URL, LLM_MODEL are set correctly
2. Verify API key has sufficient quota
3. Check model name includes provider prefix (e.g., `openai/qwen-plus`)

### Low Report Quality

```
Report quality too low: 3/5
```

**Solution**:
1. Increase `max_rounds` for more thorough research
2. Check LLM responses in logs
3. Verify prompts are generating structured output

## Related Files (V1 Architecture)

- `atoms_plus/deep_research/__init__.py` - Module entry
- `atoms_plus/deep_research/api.py` - FastAPI router
- `atoms_plus/deep_research/models.py` - Pydantic models
- `atoms_plus/deep_research/research.py` - Core research logic
- `atoms_plus/deep_research/search.py` - Search engine abstraction
- `atoms_plus/deep_research/prompts.py` - LLM prompts
- `atoms_plus/atoms_server.py` - Router registration
```

### 11.6 测试执行流程

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     E2E 测试执行流程 (V1 Architecture)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Stage 1: 单元测试 (无需外部服务, ~5s)                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ $ PYTHONPATH=".:$PYTHONPATH" poetry run pytest \                         │   │
│  │     tests/unit/atoms_plus/test_deep_research_*.py -v                     │   │
│  │                                                                          │   │
│  │ Tests:                                                                   │   │
│  │   ✅ test_search_engine                                                  │   │
│  │   ✅ test_models                                                         │   │
│  │   ✅ test_api_endpoints                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                 │                                               │
│                                 ▼                                               │
│  Stage 2: 集成测试 (需要 API Keys, ~2min)                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ $ export TAVILY_API_KEY=tvly-xxx                                         │   │
│  │ $ export LLM_API_KEY=sk-xxx LLM_BASE_URL=... LLM_MODEL=...              │   │
│  │ $ PYTHONPATH=".:$PYTHONPATH" poetry run pytest \                         │   │
│  │     tests/integration/test_deep_research_e2e.py -v -s --timeout=300      │   │
│  │                                                                          │   │
│  │ Tests:                                                                   │   │
│  │   ✅ test_search_engine_connection                                       │   │
│  │   ✅ test_complete_research_flow                                         │   │
│  │   ✅ test_report_quality_validation                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                 │                                               │
│                                 ▼                                               │
│  Stage 3: 服务器测试 (需要本地服务器)                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ # Terminal 1: 启动 Atoms Plus 服务器                                     │   │
│  │ $ python -m atoms_plus.atoms_server                                      │   │
│  │                                                                          │   │
│  │ # Terminal 2: 测试 REST API                                              │   │
│  │ $ curl -X POST http://localhost:3000/api/v1/research \                   │   │
│  │     -H "Content-Type: application/json" \                                │   │
│  │     -d '{"query": "AI trends 2025", "max_rounds": 1}'                    │   │
│  │                                                                          │   │
│  │ # Terminal 3: 测试 WebSocket 流式输出                                    │   │
│  │ $ wscat -c ws://localhost:3000/api/v1/research/stream                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 11.7 与现有测试的对比

| 方面 | Vibe Coding E2E | Deep Research E2E (V1) |
|------|-----------------|------------------------|
| **测试目标** | 角色检测 + 代码生成 | 搜索 + 报告生成 |
| **依赖 API** | LLM | Search Engine + LLM |
| **测试时长** | ~30s (单测) / ~3min (全流程) | ~5s (单测) / ~2min (全流程) |
| **质量检查** | 8项代码质量检查 | 5项报告质量检查 |
| **Pass 阈值** | 70% | 80% |
| **文件位置** | `tests/e2e/test_vibe_coding_*.py` | `tests/unit/atoms_plus/`, `tests/integration/` |
| **Skill 文件** | `.claude/skills/vibe-coding-e2e-test/` | `.claude/skills/deep-research-e2e-test/` |

## 12. 后续扩展

### 12.1 已实现 (本方案)

| 功能 | 描述 | 状态 |
|------|------|------|
| REST API | `POST /api/v1/research` | ✅ |
| WebSocket 流式 | `/api/v1/research/stream` | ✅ |
| 搜索引擎抽象 | Tavily / DashScope 双引擎 | ✅ |
| 进度回调 | `on_progress` callback | ✅ |

### 12.2 后续扩展计划

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **结果缓存** | 基于 query hash 缓存搜索结果 | 🟡 中 |
| **语言检测** | 自动检测 query 语言选择引擎 | 🟡 中 |
| **导出格式** | PDF / Word / HTML 导出 | 🟢 低 |
| **Team Mode** | 作为 Researcher 角色集成 | 🔴 高 |
| **MCP Tool** | 暴露为 MCP Tool 供其他 Agent 调用 | 🟡 中 |

### 12.3 Team Mode 集成预览

```python
# atoms_plus/team_mode/roles/researcher.py (未来)
from atoms_plus.deep_research import deep_research_async

class ResearcherRole:
    """Deep Researcher role for Team Mode."""

    async def execute(self, task: str) -> str:
        result = await deep_research_async(
            query=task,
            max_rounds=2,
            search_engine="auto",
        )
        return result.report
```

---

## 附录 A: V0 vs V1 架构对比

| 方面 | V0 (不要使用) | V1 (本方案) |
|------|--------------|-------------|
| **代码位置** | `openhands/runtime/plugins/agent_skills/` | `atoms_plus/deep_research/` |
| **暴露方式** | IPython + function_calling.py | FastAPI Router |
| **调用方式** | Agent 生成 Python 代码执行 | REST API / WebSocket |
| **删除时间** | 2026-04-01 | 长期支持 |

## 附录 B: 搜索引擎配置

```bash
# 推荐: Tavily (英文搜索更优)
export TAVILY_API_KEY=tvly-xxx

# 备选: DashScope (中文搜索更优)
export DASHSCOPE_API_KEY=sk-xxx

# 自动选择: 优先 Tavily，fallback 到 DashScope
# 代码中使用 search_engine="auto"
```

