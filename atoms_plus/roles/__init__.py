# Atoms Plus Role System
"""
Role-based multi-agent system for Atoms Plus.

Architecture (v2):
- Role definitions are stored as OpenHands microagents in .openhands/microagents/role-*.md
- Auto-Role API reads triggers from microagent frontmatter for UI display
- Actual prompt injection is handled natively by OpenHands Memory system
- Single source of truth: microagent files define both detection and behavior

Usage:
    # The role API is available at /api/v1/roles/
    # - GET /api/v1/roles/list - List all available roles
    # - POST /api/v1/roles/auto-detect - Detect best role for user input

    # Microagents handle prompt injection automatically based on triggers
"""

from atoms_plus.roles.api import router

__all__ = [
    'router',
]
