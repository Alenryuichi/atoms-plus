# Atoms Plus - LLM-based Role Router
"""
Smart role detection using LLM instead of keyword triggers.

This module provides intelligent role selection by analyzing user intent
with an LLM, rather than simple keyword matching.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from litellm import acompletion

from atoms_plus.team_mode.nodes.base import get_llm_config

logger = logging.getLogger(__name__)

# Role detection prompt - Vibe Coding Mode (prefer web app generation)
ROLE_DETECTION_PROMPT = """You are a role classifier for Vibe Coding - a web development assistant.

CORE PRINCIPLE: In Vibe Coding, we ALWAYS try to produce a working web application.
The goal is to generate runnable code, not just documentation or plans.

Analyze the user's request and determine:
1. Can this request result in a web application? (Almost always YES)
2. What specialist role should handle the coding task?

Available roles (ALWAYS return with "role-" prefix):
- role-engineer: Default. Writes React/Vue/Next.js code, implements features.
- role-architect: Designs AND implements system architecture with code.
- role-product-manager: Only for pure documentation tasks (rare).
- role-data-analyst: Data visualization dashboards (still produces code).
- role-researcher: Only for pure research without code output (rare).
- role-project-manager: Only for planning without code output (rare).
- role-seo-specialist: SEO optimization (still produces code).
- role-team-leader: Code review and coordination.

VIBE CODING RULE: Default to is_web_app_task=true unless the request is PURELY:
- Documentation/writing only (PRD, specs, reports)
- Research/investigation only (no code output)
- Discussion/explanation only (no implementation)

Examples:
- "做一个番茄钟" → is_web_app_task: true, role-engineer (create app)
- "写一个 React 组件" → is_web_app_task: true, role-engineer (write code)
- "设计电商架构" → is_web_app_task: true, role-architect (design + implement)
- "分析需求并创建应用" → is_web_app_task: true, role-engineer (analyze + code)
- "帮我写 PRD 文档" → is_web_app_task: false, role-product-manager (doc only)
- "研究 AI 趋势" → is_web_app_task: false, role-researcher (research only)

User request: "{user_input}"

Return ONLY valid JSON (no markdown):
{{"is_web_app_task": boolean, "role_id": "role-xxx", "confidence": 0.0-1.0, "reasoning": "brief explanation"}}
"""


@dataclass
class RoleDetectionResult:
    """Result of LLM-based role detection."""

    is_web_app_task: bool
    role_id: str
    confidence: float
    reasoning: str

    @classmethod
    def from_json(cls, data: dict) -> 'RoleDetectionResult':
        # Normalize role_id to always have 'role-' prefix
        role_id = data.get('role_id', 'role-engineer')
        if not role_id.startswith('role-'):
            role_id = f'role-{role_id}'

        return cls(
            is_web_app_task=data.get('is_web_app_task', True),
            role_id=role_id,
            confidence=data.get('confidence', 0.8),
            reasoning=data.get('reasoning', 'Default role assignment'),
        )

    @classmethod
    def default(cls) -> 'RoleDetectionResult':
        """Return default result (engineer, web app task)."""
        return cls(
            is_web_app_task=True,
            role_id='role-engineer',
            confidence=0.5,
            reasoning='Default: assuming web app development task',
        )


async def detect_role_with_llm(
    user_input: str,
    model: str | None = None,
) -> RoleDetectionResult:
    """
    Use LLM to intelligently detect the most suitable role.

    Args:
        user_input: The user's original request
        model: Optional model override

    Returns:
        RoleDetectionResult with role_id, confidence, and is_web_app_task
    """
    if not user_input or not user_input.strip():
        logger.warning('[RoleRouter] Empty user input, returning default')
        return RoleDetectionResult.default()

    llm_config = get_llm_config()

    try:
        logger.info(f'[RoleRouter] Detecting role for: {user_input[:50]}...')

        response = await acompletion(
            model=model or llm_config['model'],
            messages=[
                {
                    'role': 'user',
                    'content': ROLE_DETECTION_PROMPT.format(user_input=user_input),
                }
            ],
            api_base=llm_config['api_base'],
            api_key=llm_config['api_key'],
            temperature=0.3,  # Low temperature for consistent classification
            max_tokens=256,
        )

        content = response.choices[0].message.content

        # Clean up markdown if present
        if content and content.strip().startswith('```'):
            lines = content.strip().split('\n')
            content = '\n'.join(
                line for line in lines if not line.strip().startswith('```')
            )

        result = json.loads(content)
        detection = RoleDetectionResult.from_json(result)

        logger.info(
            f'[RoleRouter] Detected: role={detection.role_id}, '
            f'web_app={detection.is_web_app_task}, '
            f'confidence={detection.confidence:.2f}'
        )

        return detection

    except json.JSONDecodeError as e:
        logger.warning(f'[RoleRouter] Failed to parse JSON: {e}')
        return RoleDetectionResult.default()
    except Exception as e:
        logger.error(f'[RoleRouter] LLM call failed: {e}')
        return RoleDetectionResult.default()
