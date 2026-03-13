# Atoms Plus - Researcher Agent Node
"""
Researcher Node: Deep research integration for Team Mode.

The Researcher agent performs deep research using the deep_research module
and injects findings into the shared state for downstream agents.

This node:
1. Receives task from PM
2. Executes deep_research_async() with appropriate parameters
3. Stores research report in state for Architect to consume
4. Provides sources and key findings for informed technical decisions

Integration Status: 🚧 WIP - Skeleton implementation
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from atoms_plus.team_mode.nodes.base import (
    AgentRole,
    AgentStatus,
    update_state_with_thought,
)
from atoms_plus.team_mode.state import TeamState

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

# =============================================================================
# Configuration
# =============================================================================

# Default research parameters
DEFAULT_MAX_ROUNDS = 2
DEFAULT_SEARCH_ENGINE = 'auto'
DEFAULT_LANGUAGE = 'auto'


# =============================================================================
# Researcher Node
# =============================================================================


async def researcher_node(state: TeamState) -> TeamState:
    """
    Researcher agent node for LangGraph.

    Responsibilities:
    1. Analyze task requirements for research needs
    2. Execute deep research via deep_research_async()
    3. Store research report and sources in state
    4. Provide structured findings for Architect

    Args:
        state: Current TeamState

    Returns:
        Updated TeamState with research results

    State Updates:
        - research_report: Full markdown report
        - research_sources: List of source URLs
        - research_summary: Key findings summary (for Architect prompt injection)

    TODO:
        - [ ] Implement research query generation from task
        - [ ] Add progress callback for streaming
        - [ ] Handle research timeout gracefully
        - [ ] Add caching for repeated queries
    """
    logger.info('[Researcher] Starting deep research')

    # Update state to show researcher is thinking
    state = update_state_with_thought(
        state,
        AgentRole.RESEARCHER,
        'Analyzing task and preparing research queries...',
        AgentStatus.THINKING,
    )

    # TODO: Extract research query from task
    # For now, use the task directly
    research_query = state.get('task', '')

    if not research_query:
        logger.warning('[Researcher] No task provided, skipping research')
        state = update_state_with_thought(
            state,
            AgentRole.RESEARCHER,
            'No task provided. Skipping research phase.',
            AgentStatus.IDLE,
        )
        return state

    # TODO: Execute deep research
    # from atoms_plus.deep_research import deep_research_async
    #
    # result = await deep_research_async(
    #     query=research_query,
    #     max_rounds=DEFAULT_MAX_ROUNDS,
    #     search_engine=DEFAULT_SEARCH_ENGINE,
    #     language=DEFAULT_LANGUAGE,
    #     on_progress=_create_progress_callback(state),
    # )
    #
    # # Store results in state
    # state['research_report'] = result.report
    # state['research_sources'] = [s.url for s in result.sources]
    # state['research_summary'] = _extract_summary(result.report)

    # Placeholder: Mark as complete with stub data
    state = update_state_with_thought(
        state,
        AgentRole.RESEARCHER,
        '🚧 Research node not yet implemented. Passing through to Architect.',
        AgentStatus.RESPONDING,
    )

    logger.info('[Researcher] Deep research complete (stub)')
    return state


# =============================================================================
# Helper Functions (TODO)
# =============================================================================


def _extract_summary(report: str, max_length: int = 2000) -> str:
    """
    Extract key findings summary from research report.

    This summary is injected into the Architect's prompt to inform
    technical decisions without overwhelming the context.

    Args:
        report: Full markdown research report
        max_length: Maximum summary length

    Returns:
        Condensed summary of key findings
    """
    # TODO: Implement intelligent summary extraction
    # - Extract executive summary section
    # - Or use LLM to summarize
    # - Or take first N paragraphs
    if len(report) <= max_length:
        return report
    return report[:max_length] + '\n\n... (truncated)'


async def _create_progress_callback(state: TeamState):
    """
    Create progress callback for streaming research updates.

    TODO: Implement WebSocket progress streaming
    """
    pass
