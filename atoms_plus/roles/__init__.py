# Atoms Plus Role System
"""
Role-based multi-agent system for Atoms Plus with AUTO-ROUTING.

The system automatically detects the best role based on user input.
No manual switching required - just input your task and the AI adapts.

Usage:
    from atoms_plus.roles import auto_route, RoleRegistry

    # Automatic role detection (RECOMMENDED)
    result = auto_route("帮我设计一个用户管理系统的架构")
    print(f"Selected: {result.role.value} ({result.confidence:.0%})")
    # Output: Selected: architect (85%)

    # Get the system prompt for the detected role
    prompt = RoleRegistry.get_system_prompt(result.role)

    # Manual role access (if needed)
    roles = RoleRegistry.list_roles()
    engineer = RoleRegistry.get_role(AgentRole.ENGINEER)
"""

from atoms_plus.roles.base import AgentRole, RoleConfig
from atoms_plus.roles.registry import RoleRegistry
from atoms_plus.roles.router import RoleRouter, RouteResult, auto_route

__all__ = [
    'AgentRole',
    'RoleConfig',
    'RoleRegistry',
    'RoleRouter',
    'RouteResult',
    'auto_route',
]
