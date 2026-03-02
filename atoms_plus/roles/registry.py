# Atoms Plus Role System - Registry
"""
Role registry for loading and managing agent roles.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional, Union

import yaml
from jinja2 import Environment, FileSystemLoader

from atoms_plus.roles.base import AgentRole, RoleConfig


class RoleRegistry:
    """Registry for managing agent roles."""

    _instance: Optional["RoleRegistry"] = None
    _roles: dict[AgentRole, RoleConfig] = {}
    _prompts_env: Optional[Environment] = None

    def __new__(cls) -> "RoleRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_roles()
            cls._instance._setup_prompts()
        return cls._instance

    def _load_roles(self) -> None:
        """Load roles from YAML configuration."""
        config_path = Path(__file__).parent / "config" / "agents.yaml"
        if not config_path.exists():
            raise FileNotFoundError(f"Role configuration not found: {config_path}")

        with open(config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)

        for role_id, role_data in config.items():
            try:
                role_enum = AgentRole.from_string(role_id)
                self._roles[role_enum] = RoleConfig(
                    id=role_data.get("id", role_id),
                    name=role_data.get("name", role_id.title()),
                    role=role_data.get("role", "Agent"),
                    avatar=role_data.get("avatar", "🤖"),
                    goal=role_data.get("goal", ""),
                    backstory=role_data.get("backstory", ""),
                    capabilities=role_data.get("capabilities", []),
                    tools=role_data.get("tools", {}),
                    recommended_model=role_data.get(
                        "recommended_model", "claude-sonnet-4-20250514"
                    ),
                )
            except ValueError:
                # Skip unknown roles
                continue

    def _setup_prompts(self) -> None:
        """Setup Jinja2 environment for prompt templates."""
        prompts_dir = Path(__file__).parent / "prompts"
        if prompts_dir.exists():
            self._prompts_env = Environment(loader=FileSystemLoader(str(prompts_dir)))

    @classmethod
    def get_instance(cls) -> "RoleRegistry":
        """Get singleton instance."""
        return cls()

    @classmethod
    def list_roles(cls) -> list[dict]:
        """List all available roles."""
        instance = cls.get_instance()
        return [config.to_dict() for config in instance._roles.values()]

    @classmethod
    def get_role(cls, role: Union[AgentRole, str]) -> RoleConfig:
        """Get configuration for a specific role."""
        instance = cls.get_instance()
        if isinstance(role, str):
            role = AgentRole.from_string(role)
        if role not in instance._roles:
            raise ValueError(f"Role not found: {role}")
        return instance._roles[role]

    @classmethod
    def get_system_prompt(cls, role: Union[AgentRole, str], **context) -> str:
        """Get rendered system prompt for a role."""
        instance = cls.get_instance()
        if isinstance(role, str):
            role = AgentRole.from_string(role)

        config = instance._roles.get(role)
        if not config:
            raise ValueError(f"Role not found: {role}")

        # Try to load role-specific prompt template
        template_name = f"{role.value}.j2"
        if instance._prompts_env:
            try:
                template = instance._prompts_env.get_template(template_name)
                return template.render(role=config, **context)
            except Exception:
                pass

        # Fallback to default prompt structure
        return cls._generate_default_prompt(config)

    @classmethod
    def _generate_default_prompt(cls, config: RoleConfig) -> str:
        """Generate a default system prompt from role config."""
        return f"""You are {config.name}, a {config.role}.

<ROLE>
{config.goal}
</ROLE>

<BACKSTORY>
{config.backstory}
</BACKSTORY>

<CAPABILITIES>
Your key capabilities include:
{chr(10).join(f"- {cap}" for cap in config.capabilities)}
</CAPABILITIES>

Follow the instructions carefully and leverage your expertise to deliver high-quality results.
"""

