# Atoms Plus - Team Mode
"""
Team Mode: Multi-agent collaboration powered by LangGraph 1.0.

This module provides visible multi-agent collaboration where specialized AI agents
(Architect, Engineer, PM, etc.) work together in real-time to solve complex
development tasks.

Key Features:
- LangGraph StateGraph for orchestration
- WebSocket streaming for real-time visibility
- 8 specialized agent roles (3 in MVP)
- LiteLLM integration for multi-provider LLM support

MVP Roles (Phase 1):
- Architect: System design and architecture decisions
- Engineer: Implementation and code generation
- PM (Product Manager): Requirements decomposition and user stories

Future Roles (Phase 2):
- Data Analyst
- Researcher
- Project Manager
- SEO Specialist
- Team Leader
"""

__version__ = '0.1.0'


def __getattr__(name: str):
    """Lazy import to avoid requiring langgraph at import time."""
    if name == 'TeamState':
        from atoms_plus.team_mode.state import TeamState

        return TeamState
    if name == 'create_team_graph':
        from atoms_plus.team_mode.graph import create_team_graph

        return create_team_graph
    if name == 'get_session_state':
        from atoms_plus.team_mode.graph import get_session_state

        return get_session_state
    if name == 'list_saved_sessions':
        from atoms_plus.team_mode.graph import list_saved_sessions

        return list_saved_sessions
    raise AttributeError(f'module {__name__!r} has no attribute {name!r}')


__all__ = [
    'TeamState',
    'create_team_graph',
    'get_session_state',
    'list_saved_sessions',
]
