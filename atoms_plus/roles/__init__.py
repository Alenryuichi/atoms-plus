# Atoms Plus Role System
"""
Role-based multi-agent system for Atoms Plus.

This module provides a flexible role system that allows users to select
different AI personas with specialized capabilities and system prompts.

Usage:
    from atoms_plus.roles import RoleRegistry, AgentRole

    # Get all available roles
    roles = RoleRegistry.list_roles()

    # Get a specific role configuration
    engineer = RoleRegistry.get_role(AgentRole.ENGINEER)

    # Get the system prompt for a role
    prompt = RoleRegistry.get_system_prompt(AgentRole.ENGINEER)
"""

from atoms_plus.roles.base import AgentRole, RoleConfig
from atoms_plus.roles.registry import RoleRegistry

__all__ = [
    "AgentRole",
    "RoleConfig",
    "RoleRegistry",
]

