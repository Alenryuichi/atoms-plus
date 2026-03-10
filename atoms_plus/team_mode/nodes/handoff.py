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


async def send_message_to_openhands_v0(
    server_url: str,
    conversation_id: str,
    message: str,
) -> dict[str, Any]:
    """
    Send a message to a V0 OpenHands conversation via HTTP API.

    V0 conversations run in the main server process and use the simpler
    /message endpoint that accepts just a message string.

    Args:
        server_url: Base URL of the main server (e.g., http://localhost:3000)
        conversation_id: OpenHands conversation ID
        message: Message content to send

    Returns:
        API response as dict
    """
    url = f'{server_url}/api/conversations/{conversation_id}/message'

    # V0 uses simple message format
    payload = {'message': message}

    headers = {'Content-Type': 'application/json'}

    logger.info(f'[Handoff V0] POST {url} (payload size: {len(message)} chars)')

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        response = await client.post(url, json=payload, headers=headers)
        logger.info(f'[Handoff V0] Response status: {response.status_code}')
        response.raise_for_status()
        result = response.json()
        logger.info(f'[Handoff V0] Response body: {result}')
        return result


async def send_message_to_openhands_v1(
    sandbox_url: str,
    conversation_id: str,
    session_api_key: str,
    message: str,
) -> dict[str, Any]:
    """
    Send a message to a V1 OpenHands conversation via HTTP API.

    V1 conversations run in separate sandbox processes and require
    the SendMessageRequest format with API key authentication.

    Args:
        sandbox_url: Base URL of the sandbox (e.g., http://localhost:8003)
        conversation_id: OpenHands conversation ID
        session_api_key: Session API key for authentication
        message: Message content to send

    Returns:
        API response as dict
    """
    # Use /events endpoint with SendMessageRequest format (V1 Agent Server)
    # See: OpenAPI schema at /openapi.json -> SendMessageRequest
    url = f'{sandbox_url}/api/conversations/{conversation_id}/events'

    # Format as SendMessageRequest with TextContent array
    payload = {
        'role': 'user',
        'content': [
            {
                'type': 'text',
                'text': message,
            }
        ],
        'run': True,  # Auto-run the agent loop
    }

    headers = {
        'Content-Type': 'application/json',
        'X-Session-API-Key': session_api_key,
    }

    logger.info(f'[Handoff V1] POST {url} (payload size: {len(message)} chars)')

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        response = await client.post(url, json=payload, headers=headers)
        logger.info(f'[Handoff V1] Response status: {response.status_code}')
        response.raise_for_status()
        result = response.json()
        logger.info(f'[Handoff V1] Response body: {result}')
        return result


async def handoff_to_openhands(state: TeamState) -> TeamState:
    """
    Handoff node - delegates execution to OpenHands CodeActAgent.

    This node is only called when:
    1. conversation_id is set (bound to OpenHands conversation)
    2. execution_mode is 'execute'
    3. The Engineer has finished generating code

    It sends the formatted plan/code to the OpenHands conversation,
    which triggers the CodeActAgent to execute it.

    Supports both V0 and V1 conversations:
    - V0: Uses /message endpoint, no API key required
    - V1: Uses /events endpoint with SendMessageRequest format
    """
    conversation_id = state.get('conversation_id')
    conversation_version = state.get('conversation_version', 'V0')
    sandbox_url = state.get('sandbox_url')
    sandbox_api_key = state.get('sandbox_api_key')
    execution_mode = state.get('execution_mode')

    # Check if execution is possible
    if execution_mode != ExecutionMode.EXECUTE.value:
        logger.info('[Handoff] Skipping - execution_mode is not execute')
        return state

    # Validate required fields based on version
    if not conversation_id or not sandbox_url:
        logger.warning('[Handoff] Missing conversation_id or sandbox_url')
        thought = create_thought(
            AgentRole.ENGINEER,
            '⚠️ Cannot execute code: conversation binding not available',
            AgentStatus.ERROR,
        )
        return {
            **state,
            'thoughts': [*state.get('thoughts', []), thought],
            'error': 'Missing conversation information for code execution',
        }

    # V1 requires API key
    if conversation_version == 'V1' and not sandbox_api_key:
        logger.warning('[Handoff] V1 session requires sandbox_api_key')
        thought = create_thought(
            AgentRole.ENGINEER,
            '⚠️ Cannot execute code: V1 session API key not available',
            AgentStatus.ERROR,
        )
        return {
            **state,
            'thoughts': [*state.get('thoughts', []), thought],
            'error': 'Missing API key for V1 code execution',
        }

    # Format the handoff message
    message = format_handoff_message(state)
    logger.info(
        f'[Handoff] Sending message to OpenHands {conversation_version} '
        f'({len(message)} chars)'
    )

    try:
        # Send to OpenHands based on conversation version
        if conversation_version == 'V1':
            result = await send_message_to_openhands_v1(
                sandbox_url=sandbox_url,
                conversation_id=conversation_id,
                session_api_key=sandbox_api_key or '',
                message=message,
            )
        else:
            # V0 - use simpler /message endpoint
            result = await send_message_to_openhands_v0(
                server_url=sandbox_url,
                conversation_id=conversation_id,
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
            f'✅ Handed off to CodeActAgent ({conversation_version}) for execution\n\n{message_preview}',
            AgentStatus.RESPONDING,
            {'handoff_result': result, 'conversation_version': conversation_version},
        )

        return {
            **state,
            'thoughts': [*state.get('thoughts', []), thought],
            'handoff_message': message,
        }

    except httpx.HTTPStatusError as e:
        logger.error(f'[Handoff] HTTP error: {e}')
        error_msg = f'Handoff failed: HTTP {e.response.status_code}'
        if e.response.status_code == 404:
            error_msg += ' (conversation not found - it may have been closed)'
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
