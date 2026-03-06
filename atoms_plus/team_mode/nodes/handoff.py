# Atoms Plus - Handoff Node
"""
Handoff node for delegating code execution to OpenHands CodeActAgent.

This node:
1. Takes the plan and code from PM/Architect/Engineer
2. Formats it as a structured message
3. Sends it to the OpenHands conversation via HTTP API
4. The CodeActAgent then takes over with its ReAct loop
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from atoms_plus.team_mode.nodes.base import (
    AgentRole,
    AgentStatus,
    create_thought,
)
from atoms_plus.team_mode.state import ExecutionMode, TeamState

logger = logging.getLogger(__name__)

# Timeout for HTTP requests (60s to handle slow sandbox startups)
HTTP_TIMEOUT = 60.0


def format_handoff_message(state: TeamState) -> str:
    """
    Format the plan and code into a structured message for CodeActAgent.

    The message is formatted to give CodeActAgent clear instructions
    on what to implement based on the Team Mode planning.
    """
    task = state.get('task', '')
    plan = state.get('plan', '')
    code = state.get('code', '')
    review = state.get('review', '')

    # Build the handoff message
    parts = [
        '## 🚀 Team Mode Handoff - Please Execute the Following Plan\n',
        f'### Original Task\n{task}\n',
    ]

    if plan:
        parts.append(f'### Architecture Plan\n{plan}\n')

    if code:
        parts.append(f'### Implementation Code\n{code}\n')

    if review:
        parts.append(f'### Code Review Notes\n{review}\n')

    parts.append(
        '### Instructions\n'
        'Please implement the above plan by:\n'
        '1. Creating the necessary files and directories\n'
        '2. Writing the code as specified\n'
        '3. Running any necessary tests\n'
        '4. Reporting the results\n'
    )

    return '\n'.join(parts)


async def send_message_to_openhands(
    sandbox_url: str,
    conversation_id: str,
    session_api_key: str,
    message: str,
) -> dict[str, Any]:
    """
    Send a message to an OpenHands conversation via HTTP API.

    Args:
        sandbox_url: Base URL of the sandbox (e.g., http://localhost:8003)
        conversation_id: OpenHands conversation ID
        session_api_key: Session API key for authentication
        message: Message content to send

    Returns:
        API response as dict
    """
    url = f'{sandbox_url}/api/conversations/{conversation_id}/events'

    payload = {
        'message': message,
    }

    headers = {
        'Content-Type': 'application/json',
        'X-Session-API-Key': session_api_key,
    }

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()


async def handoff_to_openhands(state: TeamState) -> TeamState:
    """
    Handoff node - delegates execution to OpenHands CodeActAgent.

    This node is only called when:
    1. conversation_id is set (bound to OpenHands conversation)
    2. execution_mode is 'execute'
    3. The Engineer has finished generating code

    It sends the formatted plan/code to the OpenHands conversation,
    which triggers the CodeActAgent to execute it.
    """
    conversation_id = state.get('conversation_id')
    sandbox_url = state.get('sandbox_url')
    sandbox_api_key = state.get('sandbox_api_key')
    execution_mode = state.get('execution_mode')

    # Check if execution is possible
    if execution_mode != ExecutionMode.EXECUTE.value:
        logger.info('[Handoff] Skipping - execution_mode is not execute')
        return state

    if not all([conversation_id, sandbox_url, sandbox_api_key]):
        logger.warning('[Handoff] Missing sandbox info, cannot execute')
        thought = create_thought(
            AgentRole.ENGINEER,
            '⚠️ Cannot execute code: sandbox information not available',
            AgentStatus.ERROR,
        )
        return {
            **state,
            'thoughts': [*state.get('thoughts', []), thought],
            'error': 'Missing sandbox information for code execution',
        }

    # Format the handoff message
    message = format_handoff_message(state)
    logger.info(f'[Handoff] Sending message to OpenHands ({len(message)} chars)')

    try:
        # Send to OpenHands
        result = await send_message_to_openhands(
            sandbox_url=sandbox_url,
            conversation_id=conversation_id,
            session_api_key=sandbox_api_key,
            message=message,
        )

        # Record successful handoff with properly truncated preview
        preview_len = 500
        message_preview = message[:preview_len]
        if len(message) > preview_len:
            # Find last newline to avoid cutting mid-line
            last_newline = message_preview.rfind('\n')
            if last_newline > preview_len // 2:  # Only use if reasonable
                message_preview = message_preview[:last_newline]
            message_preview += '\n\n[... truncated]'

        thought = create_thought(
            AgentRole.ENGINEER,
            f'✅ Handed off to CodeActAgent for execution\n\n{message_preview}',
            AgentStatus.RESPONDING,
            {'handoff_result': result},
        )

        return {
            **state,
            'thoughts': [*state.get('thoughts', []), thought],
            'handoff_message': message,
        }

    except httpx.HTTPStatusError as e:
        logger.error(f'[Handoff] HTTP error: {e}')
        error_msg = f'Handoff failed: HTTP {e.response.status_code}'
    except httpx.TimeoutException:
        logger.error('[Handoff] Request timeout')
        error_msg = 'Handoff failed: Request timeout'
    except Exception as e:
        logger.error(f'[Handoff] Unexpected error: {e}')
        error_msg = f'Handoff failed: {e}'

    # Record error
    thought = create_thought(
        AgentRole.ENGINEER,
        f'❌ {error_msg}',
        AgentStatus.ERROR,
    )

    return {
        **state,
        'thoughts': [*state.get('thoughts', []), thought],
        'error': error_msg,
    }
