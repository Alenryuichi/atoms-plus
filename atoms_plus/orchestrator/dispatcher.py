# Atoms Plus - Task Dispatcher
"""
TaskDispatcher: Analyzes tasks and dispatches subtasks to appropriate roles.
Used by Team Leader to coordinate multi-role work.

Note: Roles are now defined as microagents in .openhands/microagents/role-*.md
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from atoms_plus.orchestrator.tools import AVAILABLE_ROLES

logger = logging.getLogger(__name__)


@dataclass
class Subtask:
    """A subtask to be delegated to a specific role."""

    role: str  # Role ID (e.g., 'architect', 'engineer')
    task: str
    context: str = ""
    expected_output: str = ""
    priority: int = 1  # 1=highest, 5=lowest
    dependencies: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "role": self.role,
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
    ROLE_KEYWORDS: dict[str, list[str]] = {
        'product_manager': [
            "requirements", "user story", "feature", "specification", "acceptance criteria",
            "PRD", "product", "stakeholder", "roadmap"
        ],
        'architect': [
            "architecture", "design", "system", "pattern", "database", "schema",
            "API", "infrastructure", "scalability", "microservice"
        ],
        'project_manager': [
            "timeline", "schedule", "milestone", "risk", "resource", "planning",
            "sprint", "deadline", "coordination"
        ],
        'engineer': [
            "implement", "code", "function", "class", "test", "bug", "fix",
            "develop", "build", "feature", "refactor"
        ],
        'data_analyst': [
            "data", "analysis", "visualization", "chart", "metrics", "SQL",
            "query", "dashboard", "statistics", "report"
        ],
        'researcher': [
            "research", "investigate", "explore", "compare", "evaluate",
            "benchmark", "study", "survey", "documentation"
        ],
        'seo_specialist': [
            "SEO", "keyword", "content", "optimization", "search", "ranking",
            "meta", "traffic", "visibility"
        ],
    }

    def suggest_role(self, task: str) -> str:
        """Suggest the best role for a given task based on keywords."""
        task_lower = task.lower()
        scores: dict[str, int] = {}

        for role, keywords in self.ROLE_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw.lower() in task_lower)
            if score > 0:
                scores[role] = score

        if scores:
            return max(scores, key=scores.get)  # type: ignore

        # Default to engineer for implementation tasks
        return 'engineer'

    def create_subtask(
        self,
        role: str,
        task: str,
        context: str = "",
        expected_output: str = "",
        priority: int = 1,
    ) -> Subtask:
        """Create a subtask for delegation."""
        if role not in AVAILABLE_ROLES:
            logger.warning(f"Unknown role '{role}', defaulting to 'engineer'")
            role = 'engineer'

        return Subtask(
            role=role,
            task=task,
            context=context,
            expected_output=expected_output,
            priority=priority,
        )

    def get_available_roles(self) -> list[str]:
        """Get list of available roles."""
        return AVAILABLE_ROLES

