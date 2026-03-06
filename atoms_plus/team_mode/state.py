# Atoms Plus - Team Mode State
"""
TeamState: TypedDict state model for LangGraph StateGraph.

This defines the shared state that flows through all agent nodes.
State is checkpointed for persistence and recovery.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Annotated, Any, TypedDict

from langgraph.graph.message import add_messages

if TYPE_CHECKING:
    pass


class AgentRole(str, Enum):
    """Available agent roles in Team Mode."""

    # MVP Roles (Phase 1)
    ARCHITECT = 'architect'
    ENGINEER = 'engineer'
    PM = 'pm'

    # Future Roles (Phase 2)
    DATA_ANALYST = 'data_analyst'
    RESEARCHER = 'researcher'
    PROJECT_MANAGER = 'project_manager'
    SEO_SPECIALIST = 'seo_specialist'
    TEAM_LEADER = 'team_leader'


class AgentStatus(str, Enum):
    """Status of an agent in the current session."""

    IDLE = 'idle'
    THINKING = 'thinking'
    ACTING = 'acting'
    RESPONDING = 'responding'
    WAITING = 'waiting'
    ERROR = 'error'


@dataclass
class AgentThought:
    """Represents a single thought/action from an agent."""

    role: AgentRole
    content: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    status: AgentStatus = AgentStatus.THINKING
    metadata: dict[str, Any] = field(default_factory=dict)


class TeamState(TypedDict):
    """
    Shared state for Team Mode LangGraph.

    This state flows through all agent nodes and is checkpointed
    for persistence and recovery.

    Attributes:
        messages: Conversation history (auto-merged by LangGraph)
        task: The user's original task description
        current_agent: Which agent is currently active
        agent_statuses: Status of each active agent
        thoughts: Stream of agent thoughts/actions for UI
        plan: High-level plan from the planner/architect
        code: Generated code from the engineer
        review: Review feedback from the architect
        iteration: Current iteration count (for revision loops)
        max_iterations: Maximum allowed iterations
        session_id: Unique session identifier
        user_id: User who initiated the session
        model: LLM model being used
        error: Any error that occurred
    """

    # Core conversation (auto-merged)
    messages: Annotated[list[dict[str, Any]], add_messages]

    # Task context
    task: str

    # Agent coordination
    current_agent: str
    agent_statuses: dict[str, str]
    thoughts: list[dict[str, Any]]

    # Work products
    plan: str | None
    code: str | None
    review: str | None

    # Iteration control
    iteration: int
    max_iterations: int

    # Session metadata
    session_id: str
    user_id: str
    model: str

    # Error handling
    error: str | None

    # Clarification (HITL) state
    # clarification_session: ClarificationSession | None
    clarification_session: dict[str, Any] | None  # Serialized ClarificationSession
    clarification_required: bool  # True if ambiguity detected
    clarification_skipped: bool  # True if user skipped all questions
    refined_requirements: str | None  # Output after clarification


def create_initial_state(
    task: str,
    session_id: str,
    user_id: str,
    model: str = 'qwen-plus',
    max_iterations: int = 3,
) -> TeamState:
    """Create initial state for a new Team Mode session."""
    return TeamState(
        messages=[],
        task=task,
        current_agent='',
        agent_statuses={},
        thoughts=[],
        plan=None,
        code=None,
        review=None,
        iteration=0,
        max_iterations=max_iterations,
        session_id=session_id,
        user_id=user_id,
        model=model,
        error=None,
        # Clarification state
        clarification_session=None,
        clarification_required=False,
        clarification_skipped=False,
        refined_requirements=None,
    )
