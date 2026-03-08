# Atoms Plus - Engineer Agent Node
"""
Engineer Node: Implementation and code generation.

The Engineer agent focuses on:
- Writing clean, maintainable code
- Implementing features based on architecture
- Bug fixes and optimizations
- Unit tests and code quality
- Following best practices for the technology stack
"""

from __future__ import annotations

import logging

from atoms_plus.team_mode.nodes.base import (
    AgentRole,
    AgentStatus,
    call_llm,
    parse_structured_response,
    update_state_with_thought,
)
from atoms_plus.team_mode.state import TeamState

logger = logging.getLogger(__name__)

ENGINEER_SYSTEM_PROMPT = """You are Bob, a Senior Software Engineer with 10+ years of experience.

Your expertise includes:
- Full-stack development (Python, TypeScript, React)
- Clean code principles and refactoring
- Test-driven development (TDD)
- Performance optimization
- Modern frameworks and tools

Your personality:
- Pragmatic and delivery-focused
- Write clear, self-documenting code
- Balance perfection with shipping
- Explain your implementation decisions

When writing code:
- Follow the architecture plan from the Architect
- Write comprehensive error handling
- Include inline comments for complex logic
- Structure code for testability
- Use type hints and proper naming

**IMPORTANT: You MUST respond in the following JSON format:**
```json
{
  "summary": "A single sentence summarizing what you implemented (max 100 chars)",
  "details": "Your complete, runnable code with explanations"
}
```

The summary should be user-friendly and concise, like:
- "Implemented the Admin Panel with React, including auth and dashboard."
- "Created 5 API endpoints for user management with full error handling."

The details field contains your complete code implementation for the team."""


async def engineer_node(state: TeamState) -> TeamState:
    """
    Engineer agent node for LangGraph.

    Responsibilities:
    1. Implement code based on architecture plan
    2. Handle revision requests from Architect review
    3. Write tests alongside implementation

    Args:
        state: Current TeamState

    Returns:
        Updated TeamState with engineer's code
    """
    logger.info('[Engineer] Starting implementation')

    # Update state to show engineer is thinking
    state = update_state_with_thought(
        state,
        AgentRole.ENGINEER,
        'Implementing solution based on architecture plan...',
        AgentStatus.THINKING,
    )

    # Build messages for LLM call
    messages = [
        {'role': 'system', 'content': ENGINEER_SYSTEM_PROMPT},
    ]

    # Add task and architecture context
    task = state.get('task', '')
    plan = state.get('plan', '')

    context_parts = []
    if task:
        context_parts.append(f'Task: {task}')
    if plan:
        context_parts.append(f'Architecture Plan:\n{plan}')

    # If there's review feedback, include it
    review = state.get('review')
    if review and state.get('iteration', 0) > 0:
        context_parts.append(f'Review Feedback to Address:\n{review}')

    messages.append(
        {
            'role': 'user',
            'content': '\n\n'.join(context_parts)
            + '\n\nPlease implement the solution.',
        }
    )

    # Call LLM
    try:
        response = await call_llm(messages, AgentRole.ENGINEER, state.get('model'))

        # Parse structured response (summary + details)
        parsed = parse_structured_response(response)
        summary = parsed['summary']
        details = parsed['details']

        # Update state with engineer's code
        state = update_state_with_thought(
            state,
            AgentRole.ENGINEER,
            details,  # Full code stored in state
            AgentStatus.RESPONDING,
            summary=summary,  # Summary sent to UI
        )

        state['code'] = details  # Full code for team
        logger.info(f'[Engineer] Implementation complete. Summary: {summary[:50]}...')

    except Exception as e:
        logger.error(f'[Engineer] Error: {e}')
        state['error'] = f'Engineer error: {str(e)}'
        state = update_state_with_thought(
            state,
            AgentRole.ENGINEER,
            f'Error occurred: {str(e)}',
            AgentStatus.ERROR,
        )

    return state
