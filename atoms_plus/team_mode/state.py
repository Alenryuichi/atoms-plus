# Atoms Plus - Team Mode State
"""TeamState: TypedDict state model for LangGraph StateGraph.

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


class ExecutionMode(str, Enum):
    """Execution mode for Team Mode."""

    PLAN_ONLY = 'plan_only'  # Generate plan/code but don't execute
    EXECUTE = 'execute'  # Execute via OpenHands CodeAct


class TeamState(TypedDict):
    """Shared state for Team Mode LangGraph.

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
        conversation_id: OpenHands conversation ID (for sandbox reuse)
        sandbox_url: Sandbox HTTP URL (e.g., http://localhost:8003)
        sandbox_api_key: Session API key for sandbox access
        execution_mode: Whether to execute code or just generate plan
        handoff_message: Message sent to OpenHands for execution
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

    # OpenHands Integration (CodeAct execution)
    conversation_id: str | None  # OpenHands conversation ID
    conversation_version: str  # 'V0' or 'V1' - determines handoff method
    sandbox_url: str | None  # Sandbox HTTP URL (V1) or main server URL (V0)
    sandbox_api_key: str | None  # Session API key (V1 only, None for V0)
    execution_mode: str  # 'plan_only' or 'execute'
    handoff_message: str | None  # Message sent to OpenHands for execution


def create_initial_state(
    task: str,
    session_id: str,
    user_id: str,
    model: str = 'MiniMax-M2.5',
    max_iterations: int = 3,
    conversation_id: str | None = None,
    conversation_version: str = 'V0',
    sandbox_url: str | None = None,
    sandbox_api_key: str | None = None,
    execution_mode: str = ExecutionMode.PLAN_ONLY.value,
) -> TeamState:
    """Create initial state for a new Team Mode session.

    Args:
        task: The user's task description
        session_id: Unique session identifier
        user_id: User who initiated the session
        model: LLM model to use
        max_iterations: Maximum revision iterations
        conversation_id: OpenHands conversation ID (enables execution mode)
        conversation_version: 'V0' or 'V1' - determines handoff method
        sandbox_url: Sandbox HTTP URL (V1) or main server URL (V0)
        sandbox_api_key: Session API key for sandbox access (V1 only)
        execution_mode: 'plan_only' or 'execute'

    Returns:
        Initial TeamState
    """
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
        # OpenHands Integration
        conversation_id=conversation_id,
        conversation_version=conversation_version,
        sandbox_url=sandbox_url,
        sandbox_api_key=sandbox_api_key,
        execution_mode=execution_mode,
        handoff_message=None,
    )
