# Atoms Plus Role System - Base Classes
"""
Base classes and enums for the role system.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class AgentRole(str, Enum):
    """Enumeration of available agent roles."""

    TEAM_LEADER = "team_leader"
    PRODUCT_MANAGER = "product_manager"
    ARCHITECT = "architect"
    PROJECT_MANAGER = "project_manager"
    ENGINEER = "engineer"
    DATA_ANALYST = "data_analyst"
    DEEP_RESEARCHER = "deep_researcher"
    SEO_SPECIALIST = "seo_specialist"

    @classmethod
    def from_string(cls, value: str) -> "AgentRole":
        """Convert string to AgentRole enum."""
        try:
            return cls(value.lower())
        except ValueError:
            raise ValueError(
                f"Invalid role: {value}. Valid roles: {[r.value for r in cls]}"
            )


@dataclass
class RoleConfig:
    """Configuration for an agent role."""

    id: str
    name: str
    role: str
    avatar: str
    goal: str
    backstory: str
    capabilities: list[str] = field(default_factory=list)
    tools: dict[str, bool] = field(default_factory=dict)
    recommended_model: str = "claude-sonnet-4-20250514"

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "avatar": self.avatar,
            "goal": self.goal,
            "backstory": self.backstory,
            "capabilities": self.capabilities,
            "recommended_model": self.recommended_model,
        }

    def get_tool_config(self) -> dict[str, bool]:
        """Get tool configuration for this role."""
        # Default tools
        defaults = {
            "enable_cmd": True,
            "enable_think": True,
            "enable_finish": True,
            "enable_editor": False,
            "enable_jupyter": False,
            "enable_browsing": False,
            "enable_plan_mode": False,
        }
        # Override with role-specific tools
        defaults.update(self.tools)
        return defaults

