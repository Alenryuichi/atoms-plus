# Atoms Plus - Base Agent Node
"""
Base utilities for agent nodes.

Provides common functionality for LLM calls, thought streaming,
and state updates shared across all agent nodes.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import litellm
from litellm import acompletion

from atoms_plus.team_mode.state import AgentRole, AgentStatus, TeamState

logger = logging.getLogger(__name__)

# Configure litellm
litellm.set_verbose = False

# Default model configuration
DEFAULT_MODEL = 'openai/qwen-plus'
DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

# Cache for settings with mtime tracking to detect changes
_settings_cache: dict[str, Any] | None = None
_settings_mtime: float = 0.0


def _load_user_settings() -> dict[str, Any]:
    """Load user settings from ~/.openhands/settings.json with cache invalidation."""
    global _settings_cache, _settings_mtime

    settings_path = Path.home() / '.openhands' / 'settings.json'

    # Check if file exists and get its mtime
    if settings_path.exists():
        try:
            current_mtime = settings_path.stat().st_mtime

            # Use cache if valid and file hasn't changed
            if _settings_cache is not None and current_mtime == _settings_mtime:
                return _settings_cache

            # Load fresh settings
            with open(settings_path) as f:
                _settings_cache = json.load(f)
                _settings_mtime = current_mtime
                logger.info('[Base] Loaded settings from ~/.openhands/settings.json')
                return _settings_cache
        except Exception as e:
            logger.warning(f'[Base] Failed to load settings.json: {e}')

    _settings_cache = {}
    _settings_mtime = 0.0
    return _settings_cache


def _ensure_model_prefix(model: str, api_base: str) -> str:
    """
    Ensure model has the correct provider prefix for LiteLLM.

    For Alibaba Bailian Coding API (dashscope), models need 'openai/' prefix
    because the API is OpenAI-compatible.
    """
    if not model:
        return DEFAULT_MODEL

    # Already has a provider prefix
    if '/' in model:
        return model

    # Alibaba Bailian Coding API requires openai/ prefix
    if 'dashscope' in api_base.lower() or 'aliyun' in api_base.lower():
        return f'openai/{model}'

    # For other OpenAI-compatible APIs, add openai/ prefix
    return f'openai/{model}'


def get_llm_config() -> dict[str, Any]:
    """
    Get LLM configuration from environment or user settings.

    Priority:
    1. Environment variables (LLM_MODEL, LLM_BASE_URL, LLM_API_KEY)
    2. User settings from ~/.openhands/settings.json
    3. Default values
    """
    settings = _load_user_settings()

    # API base: env > settings > default (resolve first for model prefix logic)
    api_base = (
        os.getenv('LLM_BASE_URL') or settings.get('llm_base_url') or DEFAULT_BASE_URL
    )

    # Model: env > settings > default
    raw_model = os.getenv('LLM_MODEL') or settings.get('llm_model') or DEFAULT_MODEL
    model = _ensure_model_prefix(raw_model, api_base)

    # API key: env > settings
    api_key = os.getenv('LLM_API_KEY') or settings.get('llm_api_key') or ''

    logger.debug(f'[Base] LLM config: model={model}, api_base={api_base[:30]}...')

    return {
        'model': model,
        'api_base': api_base,
        'api_key': api_key,
    }


async def call_llm(
    messages: list[dict[str, str]],
    role: AgentRole,
    model: str | None = None,
) -> str:
    """
    Call LLM with role-specific configuration.

    Args:
        messages: Conversation messages to send
        role: The agent role making the call
        model: Optional model override

    Returns:
        LLM response content
    """
    config = get_llm_config()

    # Determine which model to use and ensure it has the correct prefix
    final_model = model or config['model']
    final_model = _ensure_model_prefix(final_model, config['api_base'])

    logger.info(f'[{role.value}] Calling LLM with model={final_model}')

    try:
        response = await acompletion(
            model=final_model,
            messages=messages,
            api_base=config['api_base'],
            api_key=config['api_key'],
            temperature=0.7,
            max_tokens=4096,
        )

        content = response.choices[0].message.content
        logger.info(f'[{role.value}] LLM response received ({len(content)} chars)')
        return content

    except Exception as e:
        logger.error(f'[{role.value}] LLM call failed: {e}')
        raise


def create_thought(
    role: AgentRole,
    content: str,
    status: AgentStatus = AgentStatus.THINKING,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create a thought entry for streaming to UI."""
    return {
        'role': role.value,
        'content': content,
        'timestamp': datetime.utcnow().isoformat(),
        'status': status.value,
        'metadata': metadata or {},
    }


def update_state_with_thought(
    state: TeamState,
    role: AgentRole,
    content: str,
    status: AgentStatus = AgentStatus.THINKING,
) -> TeamState:
    """Update state with a new thought from an agent."""
    thought = create_thought(role, content, status)

    # Create new state with updated thoughts
    new_thoughts = list(state.get('thoughts', []))
    new_thoughts.append(thought)

    # Update agent status
    new_statuses = dict(state.get('agent_statuses', {}))
    new_statuses[role.value] = status.value

    return {
        **state,
        'current_agent': role.value,
        'thoughts': new_thoughts,
        'agent_statuses': new_statuses,
    }
