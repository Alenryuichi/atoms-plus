# Deep Research 集成方案

> 将 DeepSearchAgent 的多轮搜索+反思机制集成到 OpenHands CodeActAgent 流程中

## 1. 概述

### 1.1 目标

让 CodeActAgent 能够通过 Function Calling 调用深度研究功能，执行多轮搜索、总结和反思，生成高质量的研究报告。

### 1.2 核心特性

- **多轮搜索**：对每个研究主题进行多次迭代搜索
- **LLM 反思**：识别信息缺口，自动补充搜索
- **结构化输出**：生成带来源的 Markdown 格式报告
- **MCP 集成**：使用阿里云 DashScope WebSearch MCP 服务

## 2. 架构设计

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      DeepResearch 集成架构                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐                                                           │
│  │  CodeActAgent   │                                                           │
│  │                 │                                                           │
│  │ tools = [       │                                                           │
│  │   BrowserTool,  │                                                           │
│  │   BashTool,     │                                                           │
│  │   DeepResearch- │◄─────── 新增 Tool (Function Calling)                      │
│  │       Tool,     │                                                           │
│  │   ...           │                                                           │
│  │ ]               │                                                           │
│  └────────┬────────┘                                                           │
│           │                                                                     │
│           ▼                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                function_calling.py → IPythonRunCellAction                 │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│           │                                                                     │
│           ▼                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │             agent_skills/deep_research/                                   │  │
│  │                                                                          │  │
│  │  deep_research(query, max_rounds) ──► 搜索-总结-反思循环                    │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                            │                                                    │
│                            ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                   DashScope WebSearch MCP Server                          │  │
│  │   URL: https://dashscope.aliyuncs.com/api/v1/mcps/WebSearch/mcp          │  │
│  │   Transport: Streamable HTTP                                              │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 3. 技术选型

### 3.1 为什么选择 Agent Skills + IPython 方案？

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| **新 Action 类型** | 完全原生集成 | 需要修改核心代码，V0 即将废弃 | ❌ |
| **Agent Skills + IPython** | 复用现有基础设施，不改核心 | 依赖 Jupyter 环境 | ✅ |
| **MCP Tool** | 完全解耦 | 当前 MCP 默认禁用 | ❌ |
| **Agent 委托** | 解耦 | 需要注册新 Agent 类型 | ❌ |

### 3.2 搜索服务选择

使用阿里云 DashScope WebSearch MCP 服务：

```json
{
  "mcpServers": {
    "type": "streamableHttp",
    "url": "https://dashscope.aliyuncs.com/api/v1/mcps/WebSearch/mcp",
    "headers": {
      "Authorization": "Bearer ${DASHSCOPE_API_KEY}"
    }
  }
}
```

**优势**：
- 与现有阿里云 API Key 统一
- MCP 是 OpenHands 原生支持的协议
- Streamable HTTP 传输稳定

## 4. 文件结构

```
openhands/
├── runtime/plugins/agent_skills/
│   ├── deep_research/                    # 新增目录
│   │   ├── __init__.py                   # 导出 deep_research 函数
│   │   ├── mcp_search.py                 # MCP WebSearch 封装
│   │   ├── prompts.py                    # LLM 提示词
│   │   └── research.py                   # 核心研究逻辑
│   └── agentskills.py                    # 修改：注册新 skill
│
├── agenthub/codeact_agent/
│   ├── tools/
│   │   ├── __init__.py                   # 修改：导出 DeepResearchTool
│   │   └── deep_research.py              # 新增：Tool 定义
│   ├── function_calling.py               # 修改：添加 action 映射
│   └── codeact_agent.py                  # 修改：启用 Tool
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

### 5.2 CodeActAgent 调用流程

```
User Message: "帮我研究一下 2025 年 AI Agent 的发展趋势"
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ CodeActAgent.step()                                         │
│   └── LLM 返回 tool_call: deep_research                     │
│       {                                                     │
│         "name": "deep_research",                            │
│         "arguments": {                                      │
│           "query": "2025年AI Agent发展趋势",                 │
│           "max_rounds": 2                                   │
│         }                                                   │
│       }                                                     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ function_calling.py                                         │
│   └── 转换为 IPythonRunCellAction:                          │
│       code = '''                                            │
│       from agentskills.deep_research import deep_research   │
│       result = deep_research("2025年AI Agent发展趋势", 2)    │
│       print(result)                                         │
│       '''                                                   │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Jupyter Runtime                                             │
│   └── 执行 deep_research()                                  │
│       └── 内部调用 MCP WebSearch + LLM                      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ IPythonRunCellObservation                                   │
│   content: "# 2025年AI Agent发展趋势研究报告\n\n## 1. ..."  │
└─────────────────────────────────────────────────────────────┘
```

## 6. 环境变量配置

```bash
# 必需 - DashScope WebSearch MCP
DASHSCOPE_API_KEY=sk-5e357a56fdc04855a9829ab3a09cc050

# 可选 - LLM 配置 (用于总结和反思)
LLM_API_KEY=${DASHSCOPE_API_KEY}  # 可复用同一个 key
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=openai/qwen-plus
```

## 7. API 设计

### 7.1 DeepResearchTool (Function Calling)

```python
DeepResearchTool = ChatCompletionToolParam(
    type='function',
    function=ChatCompletionToolParamFunctionChunk(
        name='deep_research',
        description='''Perform deep research on a topic using multi-round search and reflection.

Use this tool when you need to:
- Research a complex topic thoroughly
- Compare multiple options/solutions
- Gather comprehensive information from the web
- Create detailed research reports

The tool will:
1. Generate a report structure based on the query
2. For each section, perform iterative search-summarize-reflect cycles
3. Return a structured research report with sources
''',
        parameters={
            'type': 'object',
            'properties': {
                'query': {
                    'type': 'string',
                    'description': 'The research topic or question',
                },
                'max_rounds': {
                    'type': 'integer',
                    'description': 'Maximum reflection rounds per section (default: 2)',
                    'default': 2,
                },
            },
            'required': ['query'],
        },
    ),
)
```

### 7.2 Agent Skill 函数签名

```python
def deep_research(query: str, max_rounds: int = 2) -> str:
    """
    执行深度研究，返回 Markdown 格式的研究报告。

    Args:
        query: 研究主题或问题
        max_rounds: 每个章节的最大反思轮数 (默认: 2)

    Returns:
        Markdown 格式的研究报告，包含：
        - 执行摘要
        - 各章节详细内容
        - 来源链接

    Example:
        >>> report = deep_research("2025年AI发展趋势", max_rounds=2)
        >>> print(report)
        # 2025年AI发展趋势研究报告

        ## 执行摘要
        ...

        ## 1. 大语言模型发展
        ...

        ## 来源
        - [1] https://...
    """
```

## 8. 实现文件详情

### 8.1 `mcp_search.py` - MCP 搜索封装

```python
"""MCP WebSearch wrapper for DashScope."""
import asyncio
import os
from typing import Any

from openhands.mcp.client import MCPClient
from openhands.core.config.mcp_config import MCPSHTTPServerConfig

DASHSCOPE_WEBSEARCH_URL = "https://dashscope.aliyuncs.com/api/v1/mcps/WebSearch/mcp"

async def web_search(query: str, max_results: int = 10) -> list[dict[str, Any]]:
    """
    使用 DashScope WebSearch MCP 执行搜索。

    Args:
        query: 搜索关键词
        max_results: 最大结果数

    Returns:
        搜索结果列表，每个结果包含 title, url, snippet
    """
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        raise ValueError("DASHSCOPE_API_KEY environment variable is required")

    client = MCPClient()
    await client.connect_http(
        MCPSHTTPServerConfig(
            url=DASHSCOPE_WEBSEARCH_URL,
            api_key=api_key,
            timeout=60,
        )
    )

    result = await client.call_tool("web_search", {
        "query": query,
        "max_results": max_results,
    })

    return _parse_search_results(result)


def _parse_search_results(result: Any) -> list[dict[str, Any]]:
    """解析 MCP 搜索结果为统一格式。"""
    # 根据实际 MCP 响应格式解析
    parsed = []
    # TODO: 实现解析逻辑
    return parsed
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
"""Deep Research with multi-round search and reflection."""
import asyncio
import json
import os
from dataclasses import dataclass, field
from typing import Any

import litellm

from .mcp_search import web_search
from .prompts import STRUCTURE_PROMPT, SUMMARIZE_PROMPT, REFLECT_PROMPT

__all__ = ['deep_research']

@dataclass
class Section:
    title: str
    description: str
    search_query: str
    summary: str = ""
    sources: list[str] = field(default_factory=list)

@dataclass
class ReportStructure:
    title: str
    sections: list[Section]

def deep_research(query: str, max_rounds: int = 2) -> str:
    """执行深度研究，返回 Markdown 格式报告。"""
    return asyncio.run(_async_deep_research(query, max_rounds))

async def _async_deep_research(query: str, max_rounds: int) -> str:
    """异步深度研究实现。"""

    # 1. 生成报告结构
    structure = await _generate_structure(query)

    # 2. 对每个章节执行搜索-总结-反思循环
    for section in structure.sections:
        results = await web_search(section.search_query)
        section.summary = await _summarize(results, section.description)
        section.sources = [r.get("url", "") for r in results if r.get("url")]

        # 反思循环
        for _ in range(max_rounds):
            gaps = await _reflect(section.summary, section.description)
            if gaps == "COMPLETE" or not gaps:
                break
            additional = await web_search(gaps)
            section.summary = await _summarize(results + additional, section.description)
            section.sources.extend([r.get("url", "") for r in additional if r.get("url")])

    # 3. 生成最终报告
    return _format_report(query, structure)

async def _generate_structure(query: str) -> ReportStructure:
    """使用 LLM 生成报告结构。"""
    # 实现 LLM 调用
    pass

async def _summarize(results: list[dict], topic: str) -> str:
    """使用 LLM 总结搜索结果。"""
    pass

async def _reflect(summary: str, topic: str) -> str:
    """使用 LLM 反思并识别信息缺口。"""
    pass

def _format_report(query: str, structure: ReportStructure) -> str:
    """格式化为 Markdown 报告。"""
    pass
```

## 9. 实施计划

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| 1 | 创建 `deep_research/` 目录和基础文件 | 5 min |
| 2 | 实现 `mcp_search.py` (MCP 封装) | 15 min |
| 3 | 实现 `prompts.py` (LLM 提示词) | 10 min |
| 4 | 实现 `research.py` (核心逻辑) | 30 min |
| 5 | 更新 `agentskills.py` 注册 | 5 min |
| 6 | 创建 `DeepResearchTool` | 10 min |
| 7 | 更新 `function_calling.py` | 10 min |
| 8 | 更新 `codeact_agent.py` | 5 min |
| 9 | 测试集成 | 20 min |
| **总计** | | **~2 小时** |

## 10. 测试计划

### 10.1 单元测试

```python
# tests/unit/agent_skills/test_deep_research.py

def test_web_search():
    """测试 MCP WebSearch 调用。"""
    pass

def test_generate_structure():
    """测试报告结构生成。"""
    pass

def test_deep_research_integration():
    """测试完整深度研究流程。"""
    pass
```

### 10.2 集成测试

```bash
# 启动本地环境后测试
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"initial_query": "请帮我研究 2025 年 AI Agent 的发展趋势"}'
```

## 11. E2E 测试工具

> 基于现有的 `vibe-coding-e2e-test` 模式进行扩展，实现 Deep Research 的端到端测试。

### 11.1 测试架构概述

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Deep Research E2E 测试架构                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  tests/e2e/                                                                     │
│  ├── test_vibe_coding_flow.py          # 现有: Vibe Coding 流程测试             │
│  ├── test_vibe_coding_agent.py         # 现有: Vibe Coding Agent 测试           │
│  ├── test_deep_research_flow.py        # 新增: Deep Research 流程测试           │
│  └── test_deep_research_agent.py       # 新增: Deep Research Agent 集成测试     │
│                                                                                 │
│  .claude/skills/                                                                │
│  ├── vibe-coding-e2e-test/SKILL.md     # 现有: Vibe Coding 测试技能             │
│  └── deep-research-e2e-test/SKILL.md   # 新增: Deep Research 测试技能           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 新增测试文件

#### `tests/e2e/test_deep_research_flow.py` - 流程测试

```python
"""
E2E: Deep Research Complete Flow Test

This test verifies the complete Deep Research flow:
1. MCP WebSearch connection test
2. Report structure generation (LLM)
3. Search-Summarize-Reflect cycle
4. Final report quality check

Prerequisites:
- Valid DASHSCOPE_API_KEY
- Python 3.12+

Run with:
    cd tests/e2e && poetry run pytest test_deep_research_flow.py -v -s
"""

import asyncio
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))


def check_dashscope_api_available() -> bool:
    """Check if DashScope API is available."""
    return bool(os.environ.get('DASHSCOPE_API_KEY'))


@pytest.fixture
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


class TestDeepResearchFlow:
    """Test the complete Deep Research flow."""

    @pytest.mark.asyncio
    @pytest.mark.skipif(not check_dashscope_api_available(), reason='No DASHSCOPE_API_KEY')
    async def test_mcp_websearch_connection(self):
        """Test MCP WebSearch connection and basic search."""
        from atoms_plus.deep_research.mcp_search import web_search

        query = "AI Agent 2025"
        results = await web_search(query, max_results=5)

        assert len(results) > 0, "Should return search results"
        assert all('url' in r for r in results), "Results should have URLs"
        assert all('title' in r or 'snippet' in r for r in results), "Results should have content"

        print(f"✅ MCP WebSearch: {len(results)} results for '{query}'")

    @pytest.mark.asyncio
    @pytest.mark.skipif(not check_dashscope_api_available(), reason='No DASHSCOPE_API_KEY')
    async def test_report_structure_generation(self):
        """Test LLM-based report structure generation."""
        from atoms_plus.deep_research.research import _generate_structure

        query = "2025年AI发展趋势"
        structure = await _generate_structure(query)

        assert structure.title, "Report should have title"
        assert len(structure.sections) >= 3, "Report should have at least 3 sections"
        assert len(structure.sections) <= 6, "Report should have at most 6 sections"

        for section in structure.sections:
            assert section.title, "Section should have title"
            assert section.search_query, "Section should have search query"

        print(f"✅ Structure: {len(structure.sections)} sections generated")
        for s in structure.sections:
            print(f"   - {s.title}")

    @pytest.mark.asyncio
    @pytest.mark.skipif(not check_dashscope_api_available(), reason='No DASHSCOPE_API_KEY')
    async def test_summarize_and_reflect(self):
        """Test LLM summarization and reflection."""
        from atoms_plus.deep_research.research import _summarize, _reflect

        # Mock search results
        mock_results = [
            {"title": "AI Trends 2025", "url": "https://example.com/1", "snippet": "Large language models..."},
            {"title": "Future of AI", "url": "https://example.com/2", "snippet": "AI agents will..."},
        ]

        topic = "AI发展趋势"

        # Test summarization
        summary = await _summarize(mock_results, topic)
        assert len(summary) > 100, "Summary should be substantial"
        print(f"✅ Summarize: {len(summary)} chars")

        # Test reflection
        reflection = await _reflect(summary, topic)
        assert reflection == "COMPLETE" or len(reflection) > 0, "Reflection should return result"
        print(f"✅ Reflect: {'COMPLETE' if reflection == 'COMPLETE' else f'{len(reflection)} chars gap query'}")

    def test_report_quality_checks(self):
        """Test report quality validation logic."""
        sample_report = """
# 2025年AI发展趋势研究报告

## 执行摘要

本报告分析了2025年AI领域的主要发展趋势...

## 1. 大语言模型发展

### 1.1 模型能力提升
大语言模型在2025年将继续快速发展...

### 1.2 多模态融合
...

## 2. AI Agent 技术

AI Agent 作为2025年的重要趋势...

## 来源

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
            'Has Executive Summary': '摘要' in report or 'summary' in report.lower(),
            'Has Multiple Sections': report.count('## ') >= 2,
            'Has Subsections': '### ' in report,
            'Has Sources': '来源' in report or 'source' in report.lower() or '[1]' in report,
            'Has URLs': 'http' in report,
            'Minimum Length': len(report) > 1000,
            'No Empty Sections': '##\n\n##' not in report,
        }


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
```

#### `tests/e2e/test_deep_research_agent.py` - Agent 集成测试

```python
"""
E2E: Deep Research Agent Execution Test

This test simulates the complete agent execution flow with actual LLM calls
to verify that Deep Research produces comprehensive research reports.

Prerequisites:
- Valid DASHSCOPE_API_KEY
- Network access to DashScope MCP

Run with:
    cd tests/e2e && poetry run pytest test_deep_research_agent.py -v -s --timeout=300
"""

import asyncio
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))


def check_dashscope_api_available() -> bool:
    """Check if DashScope API is available."""
    return bool(os.environ.get('DASHSCOPE_API_KEY'))


@pytest.fixture
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


class TestDeepResearchAgentExecution:
    """Test complete agent execution with Deep Research."""

    @pytest.mark.asyncio
    @pytest.mark.skipif(not check_dashscope_api_available(), reason='No DASHSCOPE_API_KEY')
    async def test_complete_deep_research_flow(self):
        """Test complete flow: query → structure → search → summarize → reflect → report."""
        from atoms_plus.deep_research import deep_research

        # Step 1: User input
        user_query = "2025年AI Agent的发展趋势和应用场景"
        max_rounds = 1  # Use 1 round for faster testing

        print(f'\n📝 Research Query: {user_query}')
        print(f'🔄 Max Rounds: {max_rounds}')

        # Step 2: Execute deep research
        print('\n⏳ Executing deep research (this may take 2-5 minutes)...')

        report = deep_research(user_query, max_rounds=max_rounds)

        print(f'✅ Report generated: {len(report)} chars')

        # Step 3: Validate report quality
        quality_checks = self._validate_report_quality(report)

        passed = sum(quality_checks.values())
        total = len(quality_checks)
        print(f'\n📊 Report Quality: {passed}/{total} checks passed')

        for check, result in quality_checks.items():
            status = '✅' if result else '❌'
            print(f'   {status} {check}')

        assert passed >= total * 0.7, f'Report quality too low: {passed}/{total}'

        # Step 4: Print report preview
        print('\n' + '=' * 60)
        print('Report Preview (first 1500 chars):')
        print('=' * 60)
        print(report[:1500] + '...' if len(report) > 1500 else report)

    @pytest.mark.asyncio
    @pytest.mark.skipif(not check_dashscope_api_available(), reason='No DASHSCOPE_API_KEY')
    async def test_deep_research_with_different_topics(self):
        """Test deep research with various topic types."""
        from atoms_plus.deep_research import deep_research

        test_cases = [
            ("量子计算在金融领域的应用", "technology"),
            ("2025年全球经济趋势预测", "economics"),
            ("新能源汽车市场分析", "industry"),
        ]

        for query, topic_type in test_cases:
            print(f'\n📝 Testing [{topic_type}]: {query}')

            report = deep_research(query, max_rounds=1)

            # Basic quality check
            assert len(report) > 500, f"Report too short for {topic_type}"
            assert '##' in report, f"Report missing sections for {topic_type}"

            print(f'   ✅ {len(report)} chars, has sections')

    def _validate_report_quality(self, report: str) -> dict:
        """Validate generated report quality."""
        return {
            'Has Title': report.strip().startswith('#'),
            'Has Executive Summary': '摘要' in report or 'summary' in report.lower() or '概述' in report,
            'Has Multiple Sections': report.count('## ') >= 2,
            'Has Sources': 'http' in report or '来源' in report,
            'Minimum Length': len(report) > 2000,
            'Has Chinese Content': any('\u4e00' <= c <= '\u9fff' for c in report),
            'No Markdown Errors': '```' not in report or report.count('```') % 2 == 0,
            'Has Structured Content': '### ' in report or '1.' in report or '- ' in report,
        }


class TestDeepResearchToolIntegration:
    """Test Deep Research as CodeActAgent tool."""

    @pytest.mark.asyncio
    @pytest.mark.skipif(not check_dashscope_api_available(), reason='No DASHSCOPE_API_KEY')
    async def test_tool_call_simulation(self):
        """Simulate how CodeActAgent would call deep_research tool."""

        # Simulate the IPython code that function_calling.py would generate
        tool_call_code = '''
from atoms_plus.deep_research import deep_research
result = deep_research("AI发展趋势", max_rounds=1)
print(f"Report length: {len(result)}")
print(result[:500])
'''

        print(f'📝 Simulating tool call:')
        print(f'   Code: deep_research("AI发展趋势", max_rounds=1)')

        # Execute the simulated code
        from atoms_plus.deep_research import deep_research
        result = deep_research("AI发展趋势", max_rounds=1)

        assert len(result) > 1000, "Tool should return substantial report"
        assert '##' in result, "Tool should return structured report"

        print(f'   ✅ Tool returned {len(result)} chars')


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s', '--timeout=300'])
```

### 11.3 新增 Skill 文件

#### `.claude/skills/deep-research-e2e-test/SKILL.md`

```markdown
---
name: deep-research-e2e-test
description: E2E testing for Deep Research flow. Use when testing MCP WebSearch connection, report generation, search-summarize-reflect cycle, or debugging the complete Deep Research pipeline.
---

# Deep Research E2E Test

End-to-end testing suite for the Deep Research feature, verifying the complete flow from user query to research report generation.

## Test Files

| File | Type | Purpose |
|------|------|---------|
| `tests/e2e/test_deep_research_flow.py` | Backend | MCP, structure, summarize, reflect tests |
| `tests/e2e/test_deep_research_agent.py` | Backend | Full agent execution with LLM |

## Quick Start

### Run All Tests

```bash
# Set API key
export DASHSCOPE_API_KEY=sk-xxx

# Run flow tests (faster, ~30s)
PYTHONPATH=".:$PYTHONPATH" poetry run pytest tests/e2e/test_deep_research_flow.py -v -s

# Run agent tests (slower, ~5min)
PYTHONPATH=".:$PYTHONPATH" poetry run pytest tests/e2e/test_deep_research_agent.py -v -s --timeout=300
```

### Run Individual Tests

```bash
# Test MCP WebSearch only
PYTHONPATH=".:$PYTHONPATH" poetry run python -c "
import asyncio
import os
os.environ['DASHSCOPE_API_KEY'] = 'sk-xxx'

from atoms_plus.deep_research.mcp_search import web_search

async def test():
    results = await web_search('AI Agent 2025', max_results=5)
    print(f'Got {len(results)} results')
    for r in results[:3]:
        print(f'  - {r.get(\"title\", \"N/A\")}')

asyncio.run(test())
"

# Test full deep_research function
PYTHONPATH=".:$PYTHONPATH" poetry run python -c "
import os
os.environ['DASHSCOPE_API_KEY'] = 'sk-xxx'

from atoms_plus.deep_research import deep_research

report = deep_research('AI发展趋势', max_rounds=1)
print(f'Report: {len(report)} chars')
print(report[:1000])
"
```

## Test Coverage

```
用户查询 → 报告结构生成 → MCP搜索 → LLM总结 → LLM反思 → 报告生成
   ✅          ✅            ✅        ✅        ✅         ✅
```

| Component | Test File | Test Function |
|-----------|-----------|---------------|
| MCP WebSearch | `test_deep_research_flow.py` | `test_mcp_websearch_connection` |
| Structure Gen | `test_deep_research_flow.py` | `test_report_structure_generation` |
| Summarize | `test_deep_research_flow.py` | `test_summarize_and_reflect` |
| Reflect | `test_deep_research_flow.py` | `test_summarize_and_reflect` |
| Full Flow | `test_deep_research_agent.py` | `test_complete_deep_research_flow` |
| Multi-topic | `test_deep_research_agent.py` | `test_deep_research_with_different_topics` |
| Tool Integration | `test_deep_research_agent.py` | `test_tool_call_simulation` |

## Report Quality Checks

The tests validate generated reports against these criteria:

| Check | Description |
|-------|-------------|
| Has Title | Report starts with `#` |
| Has Executive Summary | Contains 摘要/summary/概述 |
| Has Multiple Sections | At least 2 `##` sections |
| Has Subsections | Contains `###` headers |
| Has Sources | Contains URLs or 来源 section |
| Minimum Length | > 2000 characters |
| Has Chinese Content | Contains Chinese characters |
| No Markdown Errors | Balanced code blocks |

**Pass threshold**: 70% (6/8 checks)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DASHSCOPE_API_KEY` | ✅ | Alibaba Cloud API key for MCP WebSearch + LLM |

## Expected Output

```
======================================================================
🧪 Deep Research E2E Test Suite
======================================================================

📝 Test 1: MCP WebSearch Connection
--------------------------------------------------
  ✅ Got 5 results for "AI Agent 2025"
  ✅ All results have URLs
  Result: PASSED

📝 Test 2: Report Structure Generation
--------------------------------------------------
  ✅ Generated 4 sections:
     - 大语言模型发展趋势
     - AI Agent 技术演进
     - 行业应用场景
     - 未来展望
  Result: PASSED

📝 Test 3: Summarize and Reflect
--------------------------------------------------
  ✅ Summarize: 856 chars
  ✅ Reflect: COMPLETE (no gaps)
  Result: PASSED

📝 Test 4: Complete Deep Research Flow
--------------------------------------------------
  📝 Research Query: 2025年AI Agent的发展趋势
  🔄 Max Rounds: 1
  ⏳ Executing deep research...
  ✅ Report generated: 8,432 chars

  📊 Report Quality: 8/8 checks passed
     ✅ Has Title
     ✅ Has Executive Summary
     ✅ Has Multiple Sections
     ✅ Has Sources
     ✅ Minimum Length
     ✅ Has Chinese Content
     ✅ No Markdown Errors
     ✅ Has Structured Content

  Result: PASSED

🎯 Total: 4/4 tests passed
======================================================================
```

## Troubleshooting

### MCP Connection Failed

```
Error connecting to MCP server: timeout
```

**Solution**: Check network connectivity to DashScope. Verify API key is valid.

### Low Report Quality

```
Report quality too low: 4/8
```

**Solution**:
1. Check LLM responses for errors
2. Increase `max_rounds` for more thorough research
3. Verify prompts are generating structured output

### Timeout Error

```
asyncio.TimeoutError after 300s
```

**Solution**:
1. Increase timeout: `--timeout=600`
2. Reduce `max_rounds` to 1 for testing
3. Check LLM API rate limits

## Related Files

- `atoms_plus/deep_research/__init__.py` - Module entry
- `atoms_plus/deep_research/mcp_search.py` - MCP WebSearch wrapper
- `atoms_plus/deep_research/research.py` - Core research logic
- `atoms_plus/deep_research/prompts.py` - LLM prompts
- `openhands/agenthub/codeact_agent/tools/deep_research.py` - Tool definition
```

### 11.4 测试执行流程

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         E2E 测试执行流程                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Stage 1: 单组件测试 (无需服务器, ~30s)                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ $ export DASHSCOPE_API_KEY=sk-xxx                                        │   │
│  │ $ PYTHONPATH=".:$PYTHONPATH" poetry run pytest \                         │   │
│  │     tests/e2e/test_deep_research_flow.py -v -s                           │   │
│  │                                                                          │   │
│  │ Tests:                                                                   │   │
│  │   ✅ test_mcp_websearch_connection                                       │   │
│  │   ✅ test_report_structure_generation                                    │   │
│  │   ✅ test_summarize_and_reflect                                          │   │
│  │   ✅ test_report_quality_checks                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                 │                                               │
│                                 ▼                                               │
│  Stage 2: 完整流程测试 (无需服务器, ~5min)                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ $ PYTHONPATH=".:$PYTHONPATH" poetry run pytest \                         │   │
│  │     tests/e2e/test_deep_research_agent.py -v -s --timeout=300            │   │
│  │                                                                          │   │
│  │ Tests:                                                                   │   │
│  │   ✅ test_complete_deep_research_flow                                    │   │
│  │   ✅ test_deep_research_with_different_topics                            │   │
│  │   ✅ test_tool_call_simulation                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                 │                                               │
│                                 ▼                                               │
│  Stage 3: CodeActAgent 集成测试 (需要本地服务器)                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ # Terminal 1: 启动后端                                                   │   │
│  │ $ DASHSCOPE_API_KEY=sk-xxx make run                                      │   │
│  │                                                                          │   │
│  │ # Terminal 2: 手动测试 (通过 UI 或 API)                                  │   │
│  │ # 输入: "帮我深度研究 AI Agent 发展趋势"                                 │   │
│  │ # 期望: Agent 调用 deep_research tool, 返回完整报告                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 11.5 与现有 Vibe Coding E2E Test 的对比

| 方面 | Vibe Coding E2E | Deep Research E2E |
|------|-----------------|-------------------|
| **测试目标** | 角色检测 + 代码生成 | MCP搜索 + 报告生成 |
| **依赖 API** | LLM (DashScope/OpenAI) | MCP WebSearch + LLM |
| **测试时长** | ~30s (单测) / ~3min (全流程) | ~30s (单测) / ~5min (全流程) |
| **质量检查** | 8项代码质量检查 | 8项报告质量检查 |
| **Pass 阈值** | 70% | 70% |
| **文件位置** | `tests/e2e/test_vibe_coding_*.py` | `tests/e2e/test_deep_research_*.py` |
| **Skill 文件** | `.claude/skills/vibe-coding-e2e-test/` | `.claude/skills/deep-research-e2e-test/` |

## 12. 后续扩展

1. **流式输出**：实时显示研究进度
2. **缓存机制**：缓存搜索结果避免重复调用
3. **多语言支持**：自动检测查询语言
4. **导出格式**：支持 PDF/Word 导出
5. **Team Mode 集成**：作为 Researcher 节点使用

