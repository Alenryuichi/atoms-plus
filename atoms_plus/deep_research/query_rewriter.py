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

# Query Decomposition Prompt (针对 BUILD_APP 意图) - 技术实施导向
DECOMPOSITION_PROMPT_BUILD = """用户想要构建: {context_summary}

你是一个高级全栈开发顾问。将这个需求分解为 5 个**技术实施**维度，生成开发者可直接使用的搜索查询。

⚠️ 重要：不要生成商业分析类查询（市场调研、运营策略），只生成技术实现类查询。

输出 JSON:
```json
{{
  "dimensions": [
    {{
      "name": "推荐技术栈",
      "description": "具体的框架、语言、工具选择",
      "queries": [
        "2025 {app_type} Next.js vs Nuxt.js 对比实战",
        "{app_type} TypeScript 全栈项目结构最佳实践",
        "Supabase vs Firebase {app_type} 后端选型"
      ]
    }},
    {{
      "name": "数据库设计",
      "description": "数据模型、表结构、关系设计",
      "queries": [
        "{app_type} PostgreSQL 数据库 ER 设计示例",
        "{app_type} 用户-商品-订单 表结构 SQL",
        "Prisma ORM {app_type} schema 设计"
      ]
    }},
    {{
      "name": "核心功能实现",
      "description": "具体功能的代码实现方式",
      "queries": [
        "{app_type} 用户认证 NextAuth.js 实现代码",
        "{app_type} 购物车 状态管理 Zustand 示例",
        "{app_type} 搜索过滤 API 实现 TypeScript"
      ]
    }},
    {{
      "name": "支付与第三方集成",
      "description": "支付网关、OAuth、云存储的具体接入",
      "queries": [
        "Stripe Checkout Session {app_type} 代码示例",
        "支付宝 微信支付 Node.js SDK 集成教程",
        "Cloudinary 图片上传 React 组件代码"
      ]
    }},
    {{
      "name": "部署与安全",
      "description": "部署命令、CI/CD、安全配置",
      "queries": [
        "Vercel {app_type} 部署配置 vercel.json 示例",
        "Docker Compose {app_type} 全栈部署配置",
        "{app_type} OWASP Top 10 防护 代码实现"
      ]
    }}
  ]
}}
```

关键实体: {key_entities}

要求：
1. 查询必须包含具体技术名称（如 Next.js, Stripe, Prisma）
2. 查询应能返回代码示例或配置文件
3. 避免模糊的商业术语，使用精确的技术术语
4. 每个查询都应该对开发者有直接可操作的价值
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
