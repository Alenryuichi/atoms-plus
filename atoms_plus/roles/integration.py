# Atoms Plus Role System - OpenHands Integration
"""
Integration layer between Atoms Plus roles and OpenHands agent system.

This module provides utilities to:
1. Create AgentConfig with role-specific settings
2. Inject role system prompts into CodeActAgent
3. Configure tools based on role capabilities
4. AUTO-ROUTING: Automatically detect and configure roles based on user input
"""

from __future__ import annotations

from pathlib import Path

from atoms_plus.roles.base import AgentRole
from atoms_plus.roles.registry import RoleRegistry
from atoms_plus.roles.router import RoleRouter, RouteResult
from openhands.core.config import AgentConfig


class RoleAgentAdapter:
    """
    Adapter to integrate Atoms Plus roles with OpenHands agents.

    Usage:
        adapter = RoleAgentAdapter(AgentRole.ENGINEER)
        agent_config = adapter.create_agent_config()
        system_prompt = adapter.get_enhanced_system_prompt()
    """

    def __init__(self, role: AgentRole | str):
        """
        Initialize the adapter with a role.

        Args:
            role: The role to adapt (AgentRole enum or string)
        """
        if isinstance(role, str):
            role = AgentRole.from_string(role)
        self.role = role
        self.config = RoleRegistry.get_role(role)

    def create_agent_config(
        self,
        base_config: AgentConfig | None = None,
    ) -> AgentConfig:
        """
        Create an AgentConfig with role-specific settings.

        Args:
            base_config: Optional base config to extend

        Returns:
            AgentConfig configured for this role
        """
        # Start with base config or defaults
        if base_config:
            config_dict = base_config.model_dump()
        else:
            config_dict = {}

        # Apply role-specific tool settings
        tool_config = self.config.get_tool_config()
        config_dict.update(tool_config)

        # Set the system prompt filename to use role-specific prompt
        prompt_file = f'{self.role.value}.j2'
        prompts_dir = Path(__file__).parent / 'prompts'
        if (prompts_dir / prompt_file).exists():
            config_dict['system_prompt_filename'] = prompt_file

        return AgentConfig(**config_dict)

    def get_enhanced_system_prompt(self, base_prompt: str = '') -> str:
        """
        Get the role's system prompt, optionally combined with a base prompt.

        Args:
            base_prompt: Optional base prompt to prepend

        Returns:
            The complete system prompt for this role
        """
        role_prompt = RoleRegistry.get_system_prompt(self.role)

        if base_prompt:
            return f'{base_prompt}\n\n{role_prompt}'
        return role_prompt

    def get_role_metadata(self) -> dict:
        """
        Get metadata about the role for display purposes.

        Returns:
            Dictionary with role metadata
        """
        return {
            'role_id': self.role.value,
            'role_name': self.config.name,
            'role_title': self.config.role,
            'avatar': self.config.avatar,
            'capabilities': self.config.capabilities,
        }


def get_role_system_prompt_injection(role_id: str) -> str:
    """
    Get a system prompt injection for a specific role.

    This can be appended to the conversation to switch roles mid-conversation.

    Args:
        role_id: The role identifier

    Returns:
        System prompt text to inject
    """
    try:
        adapter = RoleAgentAdapter(role_id)
        return f"""
<ROLE_SWITCH>
You are now switching to the role of {adapter.config.name} ({adapter.config.role}).

{adapter.get_enhanced_system_prompt()}
</ROLE_SWITCH>
"""
    except ValueError:
        return ''


def list_available_roles() -> list[dict]:
    """
    List all available roles with their metadata.

    Returns:
        List of role metadata dictionaries
    """
    return RoleRegistry.list_roles()


# =============================================================================
# AUTO-ROUTING INTEGRATION
# =============================================================================


def auto_configure_for_input(
    user_input: str,
    base_config: AgentConfig | None = None,
) -> tuple[AgentConfig, RouteResult, str]:
    """
    Automatically configure agent based on user input.

    This is the main entry point for the auto-routing system.
    It analyzes the user's input and returns a fully configured agent.

    Args:
        user_input: The user's message or task description
        base_config: Optional base AgentConfig to extend

    Returns:
        Tuple of (AgentConfig, RouteResult, system_prompt)

    Example:
        user_input = "设计一个电商平台的微服务架构"
        config, route_info, prompt = auto_configure_for_input(user_input)
        # route_info.role == AgentRole.ARCHITECT
        # config has architect-specific tool settings
        # prompt contains architect system prompt
    """
    # Step 1: Detect the best role
    route_result = RoleRouter.detect_role(user_input)

    # Step 2: Create adapter for the detected role
    adapter = RoleAgentAdapter(route_result.role)

    # Step 3: Generate agent config with role-specific settings
    agent_config = adapter.create_agent_config(base_config)

    # Step 4: Get the enhanced system prompt
    system_prompt = adapter.get_enhanced_system_prompt()

    return agent_config, route_result, system_prompt


def get_auto_route_injection(user_input: str) -> str:
    """
    Get a system prompt injection based on auto-detected role.

    Use this to inject role context into an existing conversation.

    Args:
        user_input: The user's message to analyze

    Returns:
        System prompt injection text
    """
    route_result = RoleRouter.detect_role(user_input)
    adapter = RoleAgentAdapter(route_result.role)

    return f"""
<AUTO_ROLE_DETECTION>
Based on your request, I'm activating the {adapter.config.name} ({adapter.config.role}) role.
Confidence: {route_result.confidence:.0%}
Reason: {route_result.reason}

{adapter.get_enhanced_system_prompt()}
</AUTO_ROLE_DETECTION>
"""
