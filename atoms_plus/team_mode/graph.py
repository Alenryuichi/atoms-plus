# Atoms Plus - Team Mode LangGraph
"""
LangGraph StateGraph definition for Team Mode.

Defines the graph structure, nodes, and edges for multi-agent collaboration.
The graph follows this flow:

1. PM Detect Ambiguity → (conditional)
   - If ambiguous: Await Clarification (HITL) → Refine Requirements → PM
   - If clear: PM → Architect
2. PM → Architect → Engineer → Architect (review)
3. If review needs revision → Engineer (loop)
4. If review approved → Complete

Graph Structure:
    [START] → pm_detect_ambiguity
                    ↓
              (ambiguous?) ─── yes ──→ pm_await_clarification (HITL)
                    │                           ↓
                   no                   pm_refine_requirements
                    │                           ↓
                    ├────────────←──────────────┘
                    ↓
                   pm → architect → engineer → architect_review
                                                      ↓
                                      [complete] ← ─ ─ → [revise] → engineer
"""

from __future__ import annotations

import logging
import os
import sqlite3
from typing import Any

from langgraph.graph import END, StateGraph

from atoms_plus.team_mode.nodes import (
    architect_node,
    engineer_node,
    pm_await_clarification_node,
    pm_detect_ambiguity_node,
    pm_node,
    pm_refine_requirements_node,
    should_clarify,
)
from atoms_plus.team_mode.router import should_continue_after_review
from atoms_plus.team_mode.state import TeamState

logger = logging.getLogger(__name__)


async def architect_review_node(state: TeamState) -> TeamState:
    """
    Architect review node - reviews Engineer's code.

    This is a separate node from the initial architect_node
    to handle the review-specific context.
    """
    # Increment iteration counter
    state['iteration'] = state.get('iteration', 0) + 1

    # Call architect node for review
    return await architect_node(state)


def create_team_graph(enable_clarification: bool = True) -> StateGraph:
    """
    Create the Team Mode LangGraph StateGraph.

    Args:
        enable_clarification: If True, includes HITL clarification nodes

    Returns:
        StateGraph ready for compilation
    """
    logger.info('[Graph] Creating Team Mode graph')

    # Initialize graph with state schema
    graph = StateGraph(TeamState)

    if enable_clarification:
        # Add clarification nodes (HITL flow)
        graph.add_node('pm_detect_ambiguity', pm_detect_ambiguity_node)
        graph.add_node('pm_await_clarification', pm_await_clarification_node)
        graph.add_node('pm_refine_requirements', pm_refine_requirements_node)

    # Add main flow nodes
    graph.add_node('pm', pm_node)
    graph.add_node('architect', architect_node)
    graph.add_node('engineer', engineer_node)
    graph.add_node('architect_review', architect_review_node)

    if enable_clarification:
        # Set entry point to ambiguity detection
        graph.set_entry_point('pm_detect_ambiguity')

        # Conditional edge: clarify or proceed
        graph.add_conditional_edges(
            'pm_detect_ambiguity',
            should_clarify,
            {
                'clarify': 'pm_await_clarification',
                'proceed': 'pm',
            },
        )

        # After clarification, refine requirements
        graph.add_edge('pm_await_clarification', 'pm_refine_requirements')
        graph.add_edge('pm_refine_requirements', 'pm')
    else:
        # Legacy flow: start with PM directly
        graph.set_entry_point('pm')

    # Main flow edges
    graph.add_edge('pm', 'architect')
    graph.add_edge('architect', 'engineer')
    graph.add_edge('engineer', 'architect_review')

    # Add conditional edge for review decision
    graph.add_conditional_edges(
        'architect_review',
        should_continue_after_review,
        {
            'revise': 'engineer',
            'complete': END,
        },
    )

    node_list = (
        'pm_detect_ambiguity, pm_await_clarification, pm_refine_requirements, '
        if enable_clarification
        else ''
    )
    logger.info(
        f'[Graph] Graph created with nodes: {node_list}'
        'pm, architect, engineer, architect_review'
    )
    return graph


def compile_team_graph(
    checkpointer: Any | None = None,
    enable_clarification: bool = True,
    interrupt_before: list[str] | None = None,
) -> Any:
    """
    Compile the Team Mode graph with optional checkpointer and HITL support.

    Args:
        checkpointer: Optional checkpointer for state persistence (required for HITL)
        enable_clarification: If True, includes HITL clarification nodes
        interrupt_before: List of node names to interrupt before (for HITL)

    Returns:
        Compiled graph ready for invocation
    """
    graph = create_team_graph(enable_clarification=enable_clarification)

    # Default interrupt points for HITL clarification
    if interrupt_before is None and enable_clarification:
        # Don't interrupt by default - the node uses interrupt() internally
        interrupt_before = []

    compile_kwargs: dict[str, Any] = {}

    if checkpointer:
        compile_kwargs['checkpointer'] = checkpointer
        logger.info('[Graph] Compiling with checkpointer (HITL enabled)')

    if interrupt_before:
        compile_kwargs['interrupt_before'] = interrupt_before
        logger.info(f'[Graph] Interrupt points: {interrupt_before}')

    compiled = graph.compile(**compile_kwargs)
    logger.info('[Graph] Graph compiled successfully')

    return compiled


# Global connection for sync checkpointer
_sync_connection: sqlite3.Connection | None = None
_async_checkpointer = None


def get_sqlite_checkpointer():
    """
    Get SQLite checkpointer for persistence (sync version).

    Returns:
        SqliteSaver instance or None if not available
    """
    global _sync_connection

    try:
        from langgraph.checkpoint.sqlite import SqliteSaver

        db_path = os.getenv('TEAM_MODE_DB', 'team_mode.db')

        # Create connection if not exists
        if _sync_connection is None:
            _sync_connection = sqlite3.connect(db_path, check_same_thread=False)

        checkpointer = SqliteSaver(conn=_sync_connection)
        logger.info(f'[Graph] SQLite checkpointer initialized: {db_path}')
        return checkpointer
    except ImportError:
        logger.warning('[Graph] langgraph-checkpoint-sqlite not installed')
        return None
    except Exception as e:
        logger.error(f'[Graph] Failed to initialize checkpointer: {e}')
        return None


async def get_async_sqlite_checkpointer():
    """
    Get async SQLite checkpointer for persistence.

    Uses aiosqlite for async database operations.

    Returns:
        AsyncSqliteSaver instance or None if not available
    """
    global _async_checkpointer

    try:
        import aiosqlite
        from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

        db_path = os.getenv('TEAM_MODE_DB', 'team_mode.db')

        # Create new connection for async operations
        conn = await aiosqlite.connect(db_path)
        checkpointer = AsyncSqliteSaver(conn=conn)
        await checkpointer.setup()  # Initialize tables

        logger.info(f'[Graph] Async SQLite checkpointer initialized: {db_path}')
        return checkpointer
    except ImportError as e:
        logger.warning(f'[Graph] Async checkpointer not available: {e}')
        # Fallback to sync checkpointer
        return get_sqlite_checkpointer()
    except Exception as e:
        logger.error(f'[Graph] Failed to initialize async checkpointer: {e}')
        return None


async def get_session_state(session_id: str) -> TeamState | None:
    """
    Retrieve saved session state from SQLite checkpointer.

    Args:
        session_id: The thread_id used when the session was created

    Returns:
        TeamState if found, None otherwise
    """
    try:
        checkpointer = await get_async_sqlite_checkpointer()
        if not checkpointer:
            return None

        config = {'configurable': {'thread_id': session_id}}
        checkpoint = await checkpointer.aget(config)

        if checkpoint and 'channel_values' in checkpoint:
            state = checkpoint['channel_values']
            logger.info(f'[Graph] Recovered session state for {session_id}')
            return state
        return None
    except Exception as e:
        logger.error(f'[Graph] Failed to recover session {session_id}: {e}')
        return None


async def list_saved_sessions(limit: int = 50) -> list[dict[str, Any]]:
    """
    List all saved sessions from the checkpointer.

    Args:
        limit: Maximum number of sessions to return

    Returns:
        List of session metadata dicts
    """
    try:
        checkpointer = await get_async_sqlite_checkpointer()
        if not checkpointer:
            return []

        sessions = []
        async for checkpoint in checkpointer.alist(limit=limit):
            sessions.append(
                {
                    'session_id': checkpoint.get('thread_id'),
                    'timestamp': checkpoint.get('ts'),
                    'checkpoint_id': checkpoint.get('id'),
                }
            )

        logger.info(f'[Graph] Listed {len(sessions)} saved sessions')
        return sessions
    except Exception as e:
        logger.error(f'[Graph] Failed to list sessions: {e}')
        return []
