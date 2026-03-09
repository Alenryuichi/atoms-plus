# Atoms Plus - Team Mode Agent Nodes
"""
Agent node implementations for LangGraph StateGraph.

Each node represents a specialized agent that processes the shared state
and produces output based on its role and expertise.

MVP Nodes (Phase 1):
- architect_node: System design and architecture
- engineer_node: Code implementation
- pm_node: Requirements and user stories

Phase 2 Nodes (WIP):
- researcher_node: Deep research integration (🚧 skeleton)

Clarification Nodes (HITL):
- pm_detect_ambiguity_node: Detect ambiguous requirements
- pm_await_clarification_node: Wait for user input (HITL interrupt)
- pm_refine_requirements_node: Refine requirements based on answers

Each node:
1. Receives the current TeamState
2. Calls LLM with role-specific prompt
3. Updates state with its output
4. Returns updated state for next node
"""

from atoms_plus.team_mode.nodes.architect import architect_node
from atoms_plus.team_mode.nodes.engineer import engineer_node
from atoms_plus.team_mode.nodes.handoff import handoff_to_openhands
from atoms_plus.team_mode.nodes.pm import pm_node
from atoms_plus.team_mode.nodes.researcher import researcher_node


# Lazy imports for clarification nodes to avoid circular imports
def _get_clarification_nodes():
    """Lazy import clarification nodes."""
    from atoms_plus.team_mode.nodes.clarification import (
        pm_await_clarification_node,
        pm_detect_ambiguity_node,
        pm_refine_requirements_node,
        should_clarify,
        should_refine,
    )

    return {
        'pm_detect_ambiguity_node': pm_detect_ambiguity_node,
        'pm_await_clarification_node': pm_await_clarification_node,
        'pm_refine_requirements_node': pm_refine_requirements_node,
        'should_clarify': should_clarify,
        'should_refine': should_refine,
    }


# For direct imports, use lazy loading
def __getattr__(name):
    """Lazy loading for clarification nodes."""
    clarification_attrs = {
        'pm_detect_ambiguity_node',
        'pm_await_clarification_node',
        'pm_refine_requirements_node',
        'should_clarify',
        'should_refine',
    }
    if name in clarification_attrs:
        nodes = _get_clarification_nodes()
        return nodes[name]
    raise AttributeError(f'module {__name__!r} has no attribute {name!r}')


__all__ = [
    'architect_node',
    'engineer_node',
    'handoff_to_openhands',
    'pm_node',
    'researcher_node',  # Phase 2 - WIP
    'pm_detect_ambiguity_node',
    'pm_await_clarification_node',
    'pm_refine_requirements_node',
    'should_clarify',
    'should_refine',
]
