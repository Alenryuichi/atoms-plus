# Atoms Plus - Team Mode Router
"""
Router: Conditional edge logic for LangGraph StateGraph.

Determines which agent should act next based on current state.
Implements the revision loop, completion logic, and handoff decisions.
"""

from __future__ import annotations

import logging
from typing import Literal

from atoms_plus.team_mode.state import ExecutionMode, TeamState

logger = logging.getLogger(__name__)


def should_continue_after_review(
    state: TeamState,
) -> Literal['revise', 'complete']:
    """
    Determine if Engineer should revise code based on Architect review.

    Logic:
    - If review contains critical issues → revise
    - If max iterations reached → complete
    - If review is positive → complete

    Args:
        state: Current TeamState

    Returns:
        "revise" to loop back to Engineer, "complete" to finish
    """
    iteration = state.get('iteration', 0)
    max_iterations = state.get('max_iterations', 3)
    review = state.get('review', '')

    # Check iteration limit
    if iteration >= max_iterations:
        logger.info(f'[Router] Max iterations ({max_iterations}) reached, completing')
        return 'complete'

    # Check for critical issues in review
    review_lower = review.lower() if review else ''
    critical_keywords = [
        'critical issue',
        'major problem',
        'needs revision',
        'must fix',
        'blocking',
        'security vulnerability',
        '重大问题',
        '需要修改',
        '必须修复',
    ]

    for keyword in critical_keywords:
        if keyword in review_lower:
            logger.info(f"[Router] Found '{keyword}' in review, requesting revision")
            return 'revise'

    # Check for approval signals
    approval_keywords = [
        'approved',
        'looks good',
        'lgtm',
        'no issues',
        'well designed',
        'ready for',
        '通过',
        '没有问题',
        '设计良好',
    ]

    for keyword in approval_keywords:
        if keyword in review_lower:
            logger.info(f"[Router] Found '{keyword}' in review, completing")
            return 'complete'

    # Default: complete if no strong signals
    logger.info('[Router] No strong revision signals, completing')
    return 'complete'


def route_initial_task(
    state: TeamState,
) -> Literal['pm', 'architect']:
    """
    Route the initial task to the appropriate starting agent.

    Logic:
    - If task looks like requirements → PM
    - If task is technical → Architect

    Args:
        state: Current TeamState

    Returns:
        "pm" or "architect" based on task type
    """
    task = state.get('task', '').lower()

    # PM-oriented keywords
    pm_keywords = [
        'feature',
        'user story',
        'requirement',
        'product',
        'mvp',
        'roadmap',
        '功能',
        '需求',
        '用户故事',
    ]

    for keyword in pm_keywords:
        if keyword in task:
            logger.info(f"[Router] Task contains '{keyword}', routing to PM")
            return 'pm'

    # Default to Architect for technical tasks
    logger.info('[Router] Routing technical task to Architect')
    return 'architect'


def check_for_error(state: TeamState) -> Literal['error', 'continue']:
    """Check if an error occurred and should halt execution."""
    if state.get('error'):
        logger.error(f'[Router] Error detected: {state["error"]}')
        return 'error'
    return 'continue'


def should_handoff(state: TeamState) -> Literal['handoff', 'end']:
    """
    Determine if we should handoff to OpenHands CodeActAgent for execution.

    Logic:
    - If execution_mode is 'execute' AND conversation_id is set → handoff
    - Otherwise → end (plan-only mode)

    Args:
        state: Current TeamState

    Returns:
        "handoff" to delegate to CodeActAgent, "end" to finish
    """
    execution_mode = state.get('execution_mode', ExecutionMode.PLAN_ONLY.value)
    conversation_id = state.get('conversation_id')
    sandbox_url = state.get('sandbox_url')
    sandbox_api_key = state.get('sandbox_api_key')
    conversation_version = state.get('conversation_version', 'V0')

    # Check if execution is enabled and sandbox info is available
    if execution_mode == ExecutionMode.EXECUTE.value:
        # V0: Only needs conversation_id and sandbox_url (no API key required)
        # V1: Needs all three: conversation_id, sandbox_url, and sandbox_api_key
        if conversation_version == 'V0':
            required_present = all([conversation_id, sandbox_url])
        else:
            required_present = all([conversation_id, sandbox_url, sandbox_api_key])

        if required_present:
            logger.info(
                f'[Router] Execution enabled ({conversation_version}), handing off '
                f'to OpenHands (conversation_id={conversation_id})'
            )
            return 'handoff'
        else:
            logger.warning(
                f'[Router] Execution enabled but sandbox info missing '
                f'(version={conversation_version}, cid={conversation_id}, '
                f'url={sandbox_url}, key={bool(sandbox_api_key)}), skipping handoff'
            )

    logger.info('[Router] Plan-only mode, ending without handoff')
    return 'end'
