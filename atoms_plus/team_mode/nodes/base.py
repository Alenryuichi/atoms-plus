# Atoms Plus - Base Agent Node
"""Base utilities for agent nodes.

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
# Priority: MiniMax-M2.5 > glm-5 > qwen3-coder-plus
DEFAULT_MODEL = 'openai/MiniMax-M2.5'
DEFAULT_BASE_URL = 'https://coding.dashscope.aliyuncs.com/v1'

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
    """Ensure model has the correct provider prefix for LiteLLM.

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
    """Get LLM configuration from environment or user settings.

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
    """Call LLM with role-specific configuration.

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


def parse_structured_response(response: str) -> dict[str, str]:
    """Parse LLM response to extract summary and details.

    Expected format from LLM:
    ```json
    {
      "summary": "One-line summary for user",
      "details": "Full internal analysis"
    }
    ```

    Falls back gracefully if JSON parsing fails:
    - First line becomes summary
    - Full response becomes details
    """
    # Try to extract JSON from response
    try:
        # Look for JSON block in markdown code fence
        if '```json' in response:
            start = response.index('```json') + 7
            end = response.index('```', start)
            json_str = response[start:end].strip()
        elif '```' in response and '{' in response:
            # Try to find JSON in any code block
            start = response.index('{')
            end = response.rindex('}') + 1
            json_str = response[start:end]
        elif response.strip().startswith('{'):
            # Direct JSON response
            json_str = response.strip()
        else:
            raise ValueError('No JSON found')

        parsed = json.loads(json_str)
        summary = parsed.get('summary', '').strip()
        details = parsed.get('details', '').strip()

        if summary:
            return {'summary': summary, 'details': details or response}

    except (ValueError, json.JSONDecodeError, KeyError) as e:
        logger.debug(f'[Base] JSON parsing failed: {e}, using fallback')

    # Fallback: find first meaningful line as summary
    lines = [line.strip() for line in response.split('\n') if line.strip()]

    # Filter out code block markers and JSON structure
    filtered_lines = []
    for line in lines:
        # Skip markdown code fences (```json, ```python, ```, etc.)
        if line.startswith('```') or line.endswith('```'):
            continue
        # Skip empty JSON braces
        if line in ['{', '}', '[', ']']:
            continue
        filtered_lines.append(line)

    # Try to extract summary value from JSON-like lines
    first_line = ''
    for line in filtered_lines:
        # Try to extract value from "summary": "..." pattern
        if '"summary"' in line:
            # Extract the value after the colon
            match = line.split(':', 1)
            if len(match) > 1:
                value = match[1].strip().strip(',').strip('"').strip()
                if value and value not in ['{', '}', '[', ']', '']:
                    first_line = value
                    break
        # Skip "details" field
        elif '"details"' in line:
            continue
        # Use any other meaningful content
        elif line and not line.startswith('"'):
            first_line = line
            break

    # If still no good line, use first filtered line
    if not first_line and filtered_lines:
        first_line = filtered_lines[0]

    # If no good line found, use a generic message
    if not first_line:
        first_line = '处理完成'

    # Clean up first line if it's a markdown header
    if first_line.startswith('#'):
        first_line = first_line.lstrip('#').strip()

    # Remove leading/trailing quotes and commas (JSON artifacts)
    first_line = first_line.strip('"').strip(',').strip()

    # Truncate if too long
    if len(first_line) > 150:
        first_line = first_line[:147] + '...'

    return {'summary': first_line, 'details': response}


def create_thought(
    role: AgentRole,
    content: str,
    status: AgentStatus = AgentStatus.THINKING,
    metadata: dict[str, Any] | None = None,
    summary: str | None = None,
) -> dict[str, Any]:
    """Create a thought entry for streaming to UI.

    Args:
        role: Agent role (PM, ARCHITECT, ENGINEER)
        content: Full thought content (details)
        status: Current agent status
        metadata: Additional metadata
        summary: One-line summary for user display (optional)
    """
    return {
        'role': role.value,
        'content': content,
        'summary': summary or content[:100] + '...' if len(content) > 100 else content,
        'timestamp': datetime.utcnow().isoformat(),
        'status': status.value,
        'metadata': metadata or {},
    }


def update_state_with_thought(
    state: TeamState,
    role: AgentRole,
    content: str,
    status: AgentStatus = AgentStatus.THINKING,
    summary: str | None = None,
) -> TeamState:
    """Update state with a new thought from an agent.

    Args:
        state: Current team state
        role: Agent role
        content: Full thought content (details)
        status: Agent status
        summary: One-line summary for user display
    """
    thought = create_thought(role, content, status, summary=summary)

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
