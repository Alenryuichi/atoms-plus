# Atoms Plus - PM (Product Manager) Agent Node
"""
PM Node: Requirements decomposition and user stories.

The PM agent focuses on:
- Breaking down high-level requirements
- Writing user stories and acceptance criteria
- Prioritizing features
- Stakeholder communication
- Ensuring user-centric design
"""

from __future__ import annotations

import logging

from atoms_plus.team_mode.nodes.base import (
    AgentRole,
    AgentStatus,
    call_llm,
    update_state_with_thought,
)
from atoms_plus.team_mode.state import TeamState

logger = logging.getLogger(__name__)

PM_SYSTEM_PROMPT = """You are Emma, an experienced Product Manager with expertise in AI/ML products.

Your expertise includes:
- Requirements elicitation and documentation
- User story writing with clear acceptance criteria
- Feature prioritization (MoSCoW, RICE, etc.)
- Stakeholder management and communication
- Agile/Scrum methodologies

Your personality:
- User-focused and empathetic
- Clear and concise communicator
- Data-driven decision maker
- Balances technical and business needs

When analyzing requirements:
- Break down complex features into manageable stories
- Define clear acceptance criteria
- Consider edge cases and error scenarios
- Prioritize based on user value and effort

Always structure your output with:
1. Feature breakdown
2. User stories (As a... I want... So that...)
3. Acceptance criteria
4. Priority recommendations"""


async def pm_node(state: TeamState) -> TeamState:
    """
    PM agent node for LangGraph.

    Responsibilities:
    1. Analyze user's task and decompose into requirements
    2. Write clear user stories with acceptance criteria
    3. Provide context for Architect and Engineer

    Args:
        state: Current TeamState

    Returns:
        Updated TeamState with PM's requirements analysis
    """
    logger.info('[PM] Starting requirements analysis')

    # Update state to show PM is thinking
    state = update_state_with_thought(
        state,
        AgentRole.PM,
        'Analyzing task and breaking down requirements...',
        AgentStatus.THINKING,
    )

    # Build messages for LLM call
    messages = [
        {'role': 'system', 'content': PM_SYSTEM_PROMPT},
    ]

    # Add task context
    task = state.get('task', '')
    if task:
        messages.append(
            {
                'role': 'user',
                'content': f"""Task from user: {task}

Please analyze this task and provide:
1. A clear breakdown of the requirements
2. User stories with acceptance criteria
3. Priority recommendations for implementation

This analysis will be used by the Architect for system design and the Engineer for implementation.""",
            }
        )

    # Call LLM
    try:
        response = await call_llm(messages, AgentRole.PM, state.get('model'))

        # Update state with PM's analysis
        state = update_state_with_thought(
            state,
            AgentRole.PM,
            response,
            AgentStatus.RESPONDING,
        )

        # Add PM's analysis to messages for context
        new_messages = list(state.get('messages', []))
        new_messages.append(
            {
                'role': 'assistant',
                'content': f'[PM Analysis]\n{response}',
                'name': 'pm',
            }
        )
        state['messages'] = new_messages

        logger.info('[PM] Requirements analysis complete')

    except Exception as e:
        logger.error(f'[PM] Error: {e}')
        state['error'] = f'PM error: {str(e)}'
        state = update_state_with_thought(
            state,
            AgentRole.PM,
            f'Error occurred: {str(e)}',
            AgentStatus.ERROR,
        )

    return state
