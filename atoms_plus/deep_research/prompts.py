"""LLM prompt templates for Deep Research functionality.

This module defines all prompt templates used in the deep research pipeline:
- STRUCTURE_PROMPT: Generate report outline from research topic
- SUMMARIZE_PROMPT: Summarize search results for a section
- REFLECT_PROMPT: Evaluate summary completeness and identify gaps
- FINAL_REPORT_PROMPT: Generate complete research report

All prompts use f-string placeholders {variable} and support both
Chinese and English output based on the input language.
"""

from __future__ import annotations

# =============================================================================
# Report Structure Generation Prompt
# =============================================================================

STRUCTURE_PROMPT = """你是一个专业的研究分析师。根据用户的研究主题，生成一个结构化的报告大纲。

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
- 章节应该覆盖主题的不同方面
- 保持逻辑递进关系
"""
"""
Generates report structure from a research topic.

Input variables:
    - query: User's research topic or question

Output format:
    JSON with title and sections array, each section containing:
    - title: Section title
    - description: What this section should research
    - search_query: Keywords for search engine
"""


# =============================================================================
# Search Results Summarization Prompt
# =============================================================================

SUMMARIZE_PROMPT = """你是一个专业的研究分析师。根据以下搜索结果，撰写关于"{topic}"的内容总结。

搜索结果:
{search_results}

要求:
- 综合多个来源的信息
- 提取关键事实和数据
- 保持客观中立
- 标注重要来源
- 长度: 300-500字
"""
"""
Summarizes search results for a specific topic.

Input variables:
    - topic: Section title or research topic
    - search_results: Formatted search results from search engine

Output format:
    Plain text summary (300-500 words) integrating multiple sources.
"""


# =============================================================================
# Reflection and Gap Identification Prompt
# =============================================================================

REFLECT_PROMPT = """你是一个严谨的研究评审员。评估以下研究总结是否完整。

研究主题: {topic}
当前总结:
{summary}

请分析:
1. 是否有明显的信息缺口？
2. 是否需要补充搜索？

如果信息完整，输出: "COMPLETE"
如果需要补充，输出需要搜索的关键词（用于填补信息缺口）

只返回 "COMPLETE" 或一个搜索查询词，不要其他内容。
"""
"""
Evaluates summary completeness and identifies information gaps.

Input variables:
    - topic: Research topic being evaluated
    - summary: Current summary content to evaluate

Output format:
    Either "COMPLETE" or a single search query to fill the gap.
"""


# =============================================================================
# Final Report Generation Prompt
# =============================================================================

FINAL_REPORT_PROMPT = """基于以下各章节的研究总结，生成一份完整的研究报告。

报告标题: {title}

章节总结:
{sections_content}

来源列表:
{sources}

要求:
1. 使用 Markdown 格式
2. 包含执行摘要 (Executive Summary)
3. 每个章节有清晰的标题和内容
4. 综合分析，避免简单罗列
5. 在报告末尾列出所有参考来源
6. 保持专业的研究报告风格
7. 总结关键发现和建议

输出格式:
# {title}

## 执行摘要
[简洁概述研究目的、方法和主要发现]

## [章节1标题]
[章节内容]

## [章节2标题]
[章节内容]

...

## 结论与建议
[总结关键发现，提出建议]

## 参考来源
[列出所有引用来源]
"""
"""
Generates final complete research report from section summaries.

Input variables:
    - title: Report title
    - sections_content: Combined content from all sections
    - sources: List of all sources used

Output format:
    Complete Markdown-formatted research report with:
    - Executive summary
    - All sections with headers
    - Conclusions and recommendations
    - References
"""


__all__ = [
    "STRUCTURE_PROMPT",
    "SUMMARIZE_PROMPT",
    "REFLECT_PROMPT",
    "FINAL_REPORT_PROMPT",
]
