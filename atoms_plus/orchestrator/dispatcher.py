# Atoms Plus - Task Dispatcher
"""
TaskDispatcher: Analyzes tasks and dispatches subtasks to appropriate roles.
Used by Team Leader to coordinate multi-role work.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from atoms_plus.roles import AgentRole, RoleRegistry

logger = logging.getLogger(__name__)


@dataclass
class Subtask:
    """A subtask to be delegated to a specific role."""

    role: AgentRole
    task: str
    context: str = ""
    expected_output: str = ""
    priority: int = 1  # 1=highest, 5=lowest
    dependencies: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "role": self.role.value,
            "task": self.task,
            "context": self.context,
            "expected_output": self.expected_output,
            "priority": self.priority,
            "dependencies": self.dependencies,
        }


@dataclass
class DispatchPlan:
    """A plan for dispatching subtasks to multiple roles."""

    original_task: str
    subtasks: list[Subtask]
    execution_order: list[list[str]] = field(default_factory=list)  # Parallel groups

    def to_dict(self) -> dict[str, Any]:
        return {
            "original_task": self.original_task,
            "subtasks": [s.to_dict() for s in self.subtasks],
            "execution_order": self.execution_order,
        }


class TaskDispatcher:
    """
    Analyzes tasks and creates dispatch plans for multi-role execution.
    
    This is used by Team Leader to:
    1. Analyze a complex task
    2. Break it down into subtasks
    3. Assign subtasks to appropriate roles
    4. Define execution order (sequential/parallel)
    """

    # Role-to-task mapping for automatic assignment
    ROLE_KEYWORDS = {
        AgentRole.PRODUCT_MANAGER: [
            "requirements", "user story", "feature", "specification", "acceptance criteria",
            "PRD", "product", "stakeholder", "roadmap"
        ],
        AgentRole.ARCHITECT: [
            "architecture", "design", "system", "pattern", "database", "schema",
            "API", "infrastructure", "scalability", "microservice"
        ],
        AgentRole.PROJECT_MANAGER: [
            "timeline", "schedule", "milestone", "risk", "resource", "planning",
            "sprint", "deadline", "coordination"
        ],
        AgentRole.ENGINEER: [
            "implement", "code", "function", "class", "test", "bug", "fix",
            "develop", "build", "feature", "refactor"
        ],
        AgentRole.DATA_ANALYST: [
            "data", "analysis", "visualization", "chart", "metrics", "SQL",
            "query", "dashboard", "statistics", "report"
        ],
        AgentRole.DEEP_RESEARCHER: [
            "research", "investigate", "explore", "compare", "evaluate",
            "benchmark", "study", "survey", "documentation"
        ],
        AgentRole.SEO_SPECIALIST: [
            "SEO", "keyword", "content", "optimization", "search", "ranking",
            "meta", "traffic", "visibility"
        ],
    }

    def suggest_role(self, task: str) -> AgentRole:
        """Suggest the best role for a given task based on keywords."""
        task_lower = task.lower()
        scores: dict[AgentRole, int] = {}

        for role, keywords in self.ROLE_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw.lower() in task_lower)
            if score > 0:
                scores[role] = score

        if scores:
            return max(scores, key=scores.get)  # type: ignore

        # Default to engineer for implementation tasks
        return AgentRole.ENGINEER

    def create_subtask(
        self,
        role: AgentRole | str,
        task: str,
        context: str = "",
        expected_output: str = "",
        priority: int = 1,
    ) -> Subtask:
        """Create a subtask for delegation."""
        if isinstance(role, str):
            role = AgentRole(role)

        return Subtask(
            role=role,
            task=task,
            context=context,
            expected_output=expected_output,
            priority=priority,
        )

    def get_role_prompt(self, role: AgentRole | str) -> str:
        """Get the system prompt for a role."""
        return RoleRegistry.get_system_prompt(role)

    def get_available_roles(self) -> list[dict[str, Any]]:
        """Get list of available roles with their info."""
        return RoleRegistry.list_roles()

