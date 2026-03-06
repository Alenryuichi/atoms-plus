# Atoms Plus - Base Agent Node
"""
Base utilities for agent nodes.

Provides common functionality for LLM calls, thought streaming,
and state updates shared across all agent nodes.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
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


def get_llm_config() -> dict[str, Any]:
    """Get LLM configuration from environment."""
    return {
        'model': os.getenv('LLM_MODEL', DEFAULT_MODEL),
        'api_base': os.getenv('LLM_BASE_URL', DEFAULT_BASE_URL),
        'api_key': os.getenv('LLM_API_KEY', ''),
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

    try:
        response = await acompletion(
            model=model or config['model'],
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
