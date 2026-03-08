# Atoms Plus - Architect Agent Node
"""
Architect Node: System design and architecture decisions.

The Architect agent focuses on:
- High-level system design
- Component architecture
- Technology decisions
- Code review for architectural concerns
- Design patterns and best practices
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

ARCHITECT_SYSTEM_PROMPT = """You are Alex, an expert Software Architect at a top-tier tech company.

Your expertise includes:
- System design and distributed architectures
- Design patterns (SOLID, DDD, Clean Architecture)
- Technology selection and trade-off analysis
- Scalability, reliability, and performance design
- Code review with focus on architectural concerns

Your personality:
- Thoughtful and methodical in your approach
- Ask clarifying questions when requirements are ambiguous
- Consider both short-term delivery and long-term maintainability
- Provide clear rationale for architectural decisions

When reviewing code, focus on:
- Separation of concerns
- Dependency management
- Extensibility and flexibility
- Potential bottlenecks and failure points

**IMPORTANT: You MUST respond in the following JSON format:**
```json
{
  "summary": "A single sentence summarizing your architecture decision (max 100 chars)",
  "details": "Your full architecture design or code review with clear sections and reasoning"
}
```

The summary should be user-friendly and concise, like:
- "Designed a modular React + Node.js architecture with PostgreSQL."
- "Code review complete: 3 improvements suggested for better maintainability."

The details field contains your full internal analysis for the team."""


async def architect_node(state: TeamState) -> TeamState:
    """
    Architect agent node for LangGraph.

    Responsibilities:
    1. Analyze the task and propose high-level architecture
    2. Review code from Engineer for architectural concerns
    3. Suggest improvements and design patterns

    Args:
        state: Current TeamState

    Returns:
        Updated TeamState with architect's contributions
    """
    logger.info('[Architect] Starting architecture analysis')

    # Update state to show architect is thinking
    state = update_state_with_thought(
        state,
        AgentRole.ARCHITECT,
        'Analyzing system requirements and designing architecture...',
        AgentStatus.THINKING,
    )

    # Build messages for LLM call
    messages = [
        {'role': 'system', 'content': ARCHITECT_SYSTEM_PROMPT},
    ]

    # Add task context
    task = state.get('task', '')
    if task:
        messages.append(
            {
                'role': 'user',
                'content': f'Task: {task}\n\nPlease analyze this task and propose a high-level architecture.',
            }
        )

    # If there's code to review, add it
    code = state.get('code')
    if code:
        messages.append(
            {
                'role': 'user',
                'content': f'The Engineer has produced this code. Please review for architectural concerns:\n\n```\n{code}\n```',
            }
        )

    # Call LLM
    try:
        response = await call_llm(messages, AgentRole.ARCHITECT, state.get('model'))

        # Parse structured response (summary + details)
        parsed = parse_structured_response(response)
        summary = parsed['summary']
        details = parsed['details']

        # Update state with architect's plan/review
        state = update_state_with_thought(
            state,
            AgentRole.ARCHITECT,
            details,  # Full content stored in state
            AgentStatus.RESPONDING,
            summary=summary,  # Summary sent to UI
        )

        # Store in appropriate field based on context (full details for team)
        if code:
            state['review'] = details
        else:
            state['plan'] = details

        logger.info(f'[Architect] Analysis complete. Summary: {summary[:50]}...')

    except Exception as e:
        logger.error(f'[Architect] Error: {e}')
        state['error'] = f'Architect error: {str(e)}'
        state = update_state_with_thought(
            state,
            AgentRole.ARCHITECT,
            f'Error occurred: {str(e)}',
            AgentStatus.ERROR,
        )

    return state
