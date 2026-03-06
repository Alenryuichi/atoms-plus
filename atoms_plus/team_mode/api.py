# Atoms Plus - Team Mode API
"""
FastAPI routes and WebSocket handlers for Team Mode.

Provides:
- REST endpoints for session management
- WebSocket endpoint for real-time streaming
- Integration with existing atoms_server.py
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from atoms_plus.team_mode.graph import (
    compile_team_graph,
    get_async_sqlite_checkpointer,
    get_session_state,
    list_saved_sessions,
)
from atoms_plus.team_mode.state import create_initial_state

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/api/v1/team', tags=['team-mode'])


# Request/Response Models
class StartSessionRequest(BaseModel):
    """Request to start a new Team Mode session."""

    task: str = Field(..., description='The task to accomplish')
    model: str = Field(default='qwen-plus', description='LLM model to use')
    max_iterations: int = Field(default=3, ge=1, le=10)


class SessionResponse(BaseModel):
    """Response with session information."""

    session_id: str
    status: str
    created_at: str


class SessionStatusResponse(BaseModel):
    """Response with session status and state."""

    session_id: str
    status: str
    current_agent: str | None
    iteration: int
    thoughts_count: int
    has_plan: bool
    has_code: bool
    has_review: bool
    error: str | None


# In-memory session storage (replace with Redis in production)
sessions: dict[str, dict[str, Any]] = {}


@router.get('/')
async def get_team_mode_info() -> dict[str, Any]:
    """Get Team Mode information."""
    return {
        'name': 'Team Mode',
        'version': '0.1.0',
        'description': 'Multi-agent collaboration powered by LangGraph',
        'mvp_agents': ['pm', 'architect', 'engineer'],
        'status': 'beta',
    }


@router.post('/sessions', response_model=SessionResponse)
async def create_session(request: StartSessionRequest) -> SessionResponse:
    """Create a new Team Mode session."""
    session_id = str(uuid.uuid4())

    # Create initial state
    state = create_initial_state(
        task=request.task,
        session_id=session_id,
        user_id='anonymous',  # TODO: Get from auth
        model=request.model,
        max_iterations=request.max_iterations,
    )

    sessions[session_id] = {
        'state': state,
        'status': 'created',
        'created_at': datetime.utcnow().isoformat(),
    }

    logger.info(f'[API] Created session {session_id}')

    return SessionResponse(
        session_id=session_id,
        status='created',
        created_at=sessions[session_id]['created_at'],
    )


@router.get('/sessions/{session_id}', response_model=SessionStatusResponse)
async def get_session_status(session_id: str) -> SessionStatusResponse:
    """Get session status and state summary."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail='Session not found')

    session = sessions[session_id]
    state = session['state']

    return SessionStatusResponse(
        session_id=session_id,
        status=session['status'],
        current_agent=state.get('current_agent'),
        iteration=state.get('iteration', 0),
        thoughts_count=len(state.get('thoughts', [])),
        has_plan=bool(state.get('plan')),
        has_code=bool(state.get('code')),
        has_review=bool(state.get('review')),
        error=state.get('error'),
    )


class SavedSessionResponse(BaseModel):
    """Response with saved session information."""

    session_id: str
    timestamp: str | None
    checkpoint_id: str | None


class RecoverSessionRequest(BaseModel):
    """Request to recover a saved session."""

    session_id: str = Field(..., description='The session ID to recover')


@router.get('/sessions/saved', response_model=list[SavedSessionResponse])
async def list_sessions() -> list[SavedSessionResponse]:
    """List all saved sessions from persistence."""
    saved = await list_saved_sessions(limit=50)
    return [
        SavedSessionResponse(
            session_id=s.get('session_id', ''),
            timestamp=s.get('timestamp'),
            checkpoint_id=s.get('checkpoint_id'),
        )
        for s in saved
    ]


@router.post('/sessions/recover', response_model=SessionStatusResponse)
async def recover_session(request: RecoverSessionRequest) -> SessionStatusResponse:
    """
    Recover a saved session from persistence.

    Loads the session state from SQLite checkpoint and adds it to active sessions.
    """
    session_id = request.session_id

    # Check if already loaded
    if session_id in sessions:
        session = sessions[session_id]
        state = session['state']
        return SessionStatusResponse(
            session_id=session_id,
            status=session['status'],
            current_agent=state.get('current_agent'),
            iteration=state.get('iteration', 0),
            thoughts_count=len(state.get('thoughts', [])),
            has_plan=bool(state.get('plan')),
            has_code=bool(state.get('code')),
            has_review=bool(state.get('review')),
            error=state.get('error'),
        )

    # Try to recover from checkpoint
    state = await get_session_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail='Session not found in persistence')

    # Add to active sessions
    sessions[session_id] = {
        'state': state,
        'status': 'recovered',
        'created_at': datetime.utcnow().isoformat(),
    }

    logger.info(f'[API] Recovered session {session_id}')

    return SessionStatusResponse(
        session_id=session_id,
        status='recovered',
        current_agent=state.get('current_agent'),
        iteration=state.get('iteration', 0),
        thoughts_count=len(state.get('thoughts', [])),
        has_plan=bool(state.get('plan')),
        has_code=bool(state.get('code')),
        has_review=bool(state.get('review')),
        error=state.get('error'),
    )


@router.websocket('/sessions/{session_id}/stream')
async def stream_session(websocket: WebSocket, session_id: str) -> None:
    """
    WebSocket endpoint for real-time session streaming.

    Streams agent thoughts and state updates as they happen.
    """
    await websocket.accept()
    logger.info(f'[WS] Client connected to session {session_id}')

    if session_id not in sessions:
        await websocket.send_json({'error': 'Session not found'})
        await websocket.close()
        return

    session = sessions[session_id]
    state = session['state']

    try:
        # Compile graph with async checkpointer
        checkpointer = await get_async_sqlite_checkpointer()
        graph = compile_team_graph(checkpointer)

        # Update session status
        session['status'] = 'running'
        await websocket.send_json({'event': 'started', 'session_id': session_id})

        # Stream graph execution
        config = {'configurable': {'thread_id': session_id}}

        async for chunk in graph.astream(state, config):
            # Extract node name and state update
            for node_name, node_state in chunk.items():
                # Send thought updates
                thoughts = node_state.get('thoughts', [])
                if thoughts:
                    latest = thoughts[-1]
                    await websocket.send_json(
                        {
                            'event': 'thought',
                            'agent': latest.get('role'),
                            'content': latest.get('content'),
                            'status': latest.get('status'),
                            'timestamp': latest.get('timestamp'),
                        }
                    )

                # Update session state
                session['state'] = node_state

        # Mark complete
        session['status'] = 'completed'
        await websocket.send_json({'event': 'completed', 'session_id': session_id})

    except WebSocketDisconnect:
        logger.info(f'[WS] Client disconnected from session {session_id}')
    except Exception as e:
        logger.error(f'[WS] Error in session {session_id}: {e}')
        session['status'] = 'error'
        await websocket.send_json({'event': 'error', 'message': str(e)})
    finally:
        await websocket.close()
