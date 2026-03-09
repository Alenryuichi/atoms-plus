"""Query Rewriter for Deep Research - 将模糊用户需求转换为具体研究查询.

三层架构:
1. Intent Analysis - 识别用户意图类型
2. Query Decomposition - 分解为研究维度
3. Multi-Query Generation - 生成具体搜索查询

Example:
    用户输入: "我要做一个电商网站"
    ↓
    意图: BUILD_APP
    维度: [技术栈, 核心功能, 第三方集成, 部署架构, 安全考量]
    查询: [
        "2025 电商网站最佳前端框架 Next.js vs Nuxt",
        "电商购物车支付系统设计模式",
        "Stripe 支付宝微信支付集成",
        ...
    ]
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from enum import Enum

import litellm

logger = logging.getLogger(__name__)


class IntentType(str, Enum):
    """用户意图类型."""

    BUILD_APP = "build_app"  # 构建应用/网站
    LEARN_TECH = "learn_tech"  # 学习技术/概念
    SOLVE_BUG = "solve_bug"  # 解决问题/调试
    COMPARE = "compare"  # 技术对比/选型
    RESEARCH = "research"  # 纯研究/调研


@dataclass
class RewrittenQuery:
    """Query Rewrite 结果."""

    original_query: str
    intent: IntentType
    intent_confidence: float
    research_dimensions: list[str]
    search_queries: list[str]
    context_summary: str  # 对用户需求的理解总结


# Intent Analysis Prompt
INTENT_ANALYSIS_PROMPT = """分析用户输入的意图类型。

用户输入: {user_input}

意图类型:
- BUILD_APP: 构建应用、网站、系统（如"做一个xxx"、"开发xxx"）
- LEARN_TECH: 学习技术、概念（如"什么是xxx"、"如何理解xxx"）
- SOLVE_BUG: 解决问题、调试（如"xxx报错"、"为什么xxx不工作"）
- COMPARE: 技术对比、选型（如"xxx vs yyy"、"选择xxx还是yyy"）
- RESEARCH: 纯研究、调研（如"xxx的现状"、"xxx的趋势"）

输出 JSON:
```json
{{
  "intent": "BUILD_APP|LEARN_TECH|SOLVE_BUG|COMPARE|RESEARCH",
  "confidence": 0.0-1.0,
  "key_entities": ["提取的关键实体"],
  "context_summary": "一句话总结用户需求"
}}
```
"""

# Query Decomposition Prompt (针对 BUILD_APP 意图)
DECOMPOSITION_PROMPT_BUILD = """用户想要构建: {context_summary}

将这个需求分解为 5 个研究维度，并为每个维度生成 3 个具体的搜索查询。

输出 JSON:
```json
{{
  "dimensions": [
    {{
      "name": "技术栈选择",
      "description": "前端框架、后端服务、数据库选择",
      "queries": [
        "2025 {app_type} 最佳前端框架推荐",
        "{app_type} 后端技术栈 Node.js vs Python",
        "{app_type} 数据库选择 PostgreSQL vs MongoDB"
      ]
    }},
    {{
      "name": "核心功能设计",
      "description": "必需的功能模块和设计模式",
      "queries": ["查询1", "查询2", "查询3"]
    }},
    {{
      "name": "第三方服务集成",
      "description": "支付、认证、存储等外部服务",
      "queries": ["查询1", "查询2", "查询3"]
    }},
    {{
      "name": "部署与运维",
      "description": "部署平台、CI/CD、监控",
      "queries": ["查询1", "查询2", "查询3"]
    }},
    {{
      "name": "安全与性能",
      "description": "安全最佳实践、性能优化",
      "queries": ["查询1", "查询2", "查询3"]
    }}
  ]
}}
```

关键实体: {key_entities}
确保查询具体、可搜索、与 {app_type} 直接相关。
"""

# Query Decomposition Prompt (通用)
DECOMPOSITION_PROMPT_GENERAL = """用户需求: {context_summary}

将这个需求分解为 3-5 个研究维度，并为每个维度生成 2-3 个具体的搜索查询。

输出 JSON:
```json
{{
  "dimensions": [
    {{
      "name": "维度名称",
      "description": "这个维度研究什么",
      "queries": ["具体搜索查询1", "具体搜索查询2"]
    }}
  ]
}}
```

关键实体: {key_entities}
确保查询具体、可搜索、直接相关。
"""


async def _call_llm(prompt: str) -> str:
    """调用 LLM 获取响应."""
    model = os.getenv("LLM_MODEL", "openai/MiniMax-M2.5")
    api_key = os.getenv("LLM_API_KEY")
    api_base = os.getenv("LLM_BASE_URL")

    response = await litellm.acompletion(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        api_key=api_key,
        api_base=api_base,
    )
    return response.choices[0].message.content


def _extract_json(text: str) -> dict:
    """从 LLM 响应中提取 JSON."""
    import re

    # 尝试提取 ```json ... ``` 块
    json_match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(1))

    # 尝试直接解析
    return json.loads(text)


async def analyze_intent(user_input: str) -> tuple[IntentType, float, list[str], str]:
    """分析用户意图.

    Returns:
        (intent_type, confidence, key_entities, context_summary)
    """
    prompt = INTENT_ANALYSIS_PROMPT.format(user_input=user_input)
    response = await _call_llm(prompt)

    try:
        data = _extract_json(response)
        intent = IntentType(data.get("intent", "research").lower())
        confidence = float(data.get("confidence", 0.8))
        entities = data.get("key_entities", [])
        summary = data.get("context_summary", user_input)
        return intent, confidence, entities, summary
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"Intent analysis failed: {e}, defaulting to RESEARCH")
        return IntentType.RESEARCH, 0.5, [], user_input


async def decompose_query(
    intent: IntentType,
    context_summary: str,
    key_entities: list[str],
) -> tuple[list[str], list[str]]:
    """分解查询为研究维度和搜索查询.

    Returns:
        (dimensions, search_queries)
    """
    # 根据意图选择 prompt 模板
    if intent == IntentType.BUILD_APP:
        app_type = key_entities[0] if key_entities else "应用"
        prompt = DECOMPOSITION_PROMPT_BUILD.format(
            context_summary=context_summary,
            key_entities=", ".join(key_entities),
            app_type=app_type,
        )
    else:
        prompt = DECOMPOSITION_PROMPT_GENERAL.format(
            context_summary=context_summary,
            key_entities=", ".join(key_entities),
        )

    response = await _call_llm(prompt)

    try:
        data = _extract_json(response)
        dimensions = []
        queries = []

        for dim in data.get("dimensions", []):
            dimensions.append(dim.get("name", ""))
            queries.extend(dim.get("queries", []))

        return dimensions, queries
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning(f"Query decomposition failed: {e}")
        # 降级: 直接使用原始查询
        return ["通用研究"], [context_summary]


async def rewrite_query(user_input: str) -> RewrittenQuery:
    """完整的 Query Rewrite 流程.

    Args:
        user_input: 用户的原始输入

    Returns:
        RewrittenQuery 包含意图、维度、搜索查询
    """
    logger.info(f'Query Rewrite: "{user_input}"')

    # Step 1: Intent Analysis
    intent, confidence, entities, summary = await analyze_intent(user_input)
    logger.info(f"  Intent: {intent.value} (confidence: {confidence:.2f})")
    logger.info(f"  Entities: {entities}")

    # Step 2: Query Decomposition
    dimensions, queries = await decompose_query(intent, summary, entities)
    logger.info(f"  Dimensions: {len(dimensions)}")
    logger.info(f"  Queries: {len(queries)}")

    return RewrittenQuery(
        original_query=user_input,
        intent=intent,
        intent_confidence=confidence,
        research_dimensions=dimensions,
        search_queries=queries,
        context_summary=summary,
    )


__all__ = [
    "IntentType",
    "RewrittenQuery",
    "rewrite_query",
    "analyze_intent",
    "decompose_query",
]
