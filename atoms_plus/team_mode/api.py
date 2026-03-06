# Atoms Plus - Team Mode API
"""
FastAPI routes and WebSocket handlers for Team Mode.

Provides:
- REST endpoints for session management
- WebSocket endpoint for real-time streaming
- Integration with existing atoms_server.py
- OpenHands conversation integration for code execution
"""

from __future__ import annotations

import logging
import uuid as uuid_module
from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from langgraph.types import Command

from atoms_plus.team_mode.graph import (
    compile_team_graph,
    get_async_sqlite_checkpointer,
    get_session_state,
    list_saved_sessions,
)
from atoms_plus.team_mode.state import ExecutionMode, create_initial_state
from openhands.app_server.app_conversation.app_conversation_service import (
    AppConversationService,
)
from openhands.app_server.config import (
    depends_app_conversation_service,
    depends_sandbox_service,
)
from openhands.app_server.sandbox.sandbox_service import SandboxService

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/api/v1/team', tags=['team-mode'])

# Dependency injection for OpenHands services
# Note: These are resolved at module load time, which is the standard pattern
# in OpenHands (see app_conversation_router.py). This requires atoms_server.py
# to import this module AFTER AppServerConfig is initialized.
app_conversation_service_dependency = depends_app_conversation_service()
sandbox_service_dependency = depends_sandbox_service()


# Request/Response Models
class StartSessionRequest(BaseModel):
    """Request to start a new Team Mode session."""

    task: str = Field(..., description='The task to accomplish')
    model: str = Field(default='qwen-plus', description='LLM model to use')
    max_iterations: int = Field(default=3, ge=1, le=10)
    # OpenHands integration (optional)
    conversation_id: str | None = Field(
        default=None,
        description='OpenHands conversation ID to bind to (enables code execution)',
    )


class SessionResponse(BaseModel):
    """Response with session information."""

    session_id: str
    status: str
    created_at: str
    execution_mode: str = Field(
        default='plan_only',
        description="'execute' if bound to conversation, 'plan_only' otherwise",
    )
    binding_warning: str | None = Field(
        default=None,
        description='Warning message if conversation binding failed',
    )


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
async def create_session(
    request: StartSessionRequest,
    app_conversation_service: AppConversationService = app_conversation_service_dependency,
    sandbox_service: SandboxService = sandbox_service_dependency,
) -> SessionResponse:
    """
    Create a new Team Mode session.

    If conversation_id is provided, the session will be bound to the existing
    OpenHands conversation and can execute code via CodeActAgent handoff.
    """
    session_id = str(uuid_module.uuid4())

    # Initialize sandbox info (will be populated if conversation_id is provided)
    conversation_id: str | None = None
    sandbox_url: str | None = None
    sandbox_api_key: str | None = None
    execution_mode = ExecutionMode.PLAN_ONLY.value
    binding_warning: str | None = None

    # If conversation_id provided, lookup sandbox info
    if request.conversation_id:
        try:
            conv_uuid = UUID(request.conversation_id)
            conversation = await app_conversation_service.get_app_conversation(
                conv_uuid
            )

            if conversation:
                conversation_id = request.conversation_id
                # Get sandbox info
                sandbox = await sandbox_service.get_sandbox(conversation.sandbox_id)
                if sandbox:
                    sandbox_api_key = sandbox.session_api_key
                    # Build sandbox URL from conversation_url or sandbox info
                    if conversation.conversation_url:
                        # Extract base URL from conversation_url
                        # e.g., http://localhost:8003/api/conversations/xxx -> http://localhost:8003
                        url_parts = conversation.conversation_url.rsplit('/api/', 1)
                        sandbox_url = url_parts[0] if url_parts else None
                    execution_mode = ExecutionMode.EXECUTE.value
                    logger.info(
                        f'[API] Bound to OpenHands conversation {conversation_id}, '
                        f'sandbox_url={sandbox_url}'
                    )
                else:
                    binding_warning = (
                        f'Sandbox not found for conversation {conversation_id}'
                    )
                    logger.warning(f'[API] {binding_warning}')
            else:
                binding_warning = f'Conversation not found: {request.conversation_id}'
                logger.warning(f'[API] {binding_warning}')
        except ValueError as e:
            binding_warning = f'Invalid conversation_id format: {e}'
            logger.warning(f'[API] {binding_warning}')

    # Create initial state with sandbox info
    state = create_initial_state(
        task=request.task,
        session_id=session_id,
        user_id='anonymous',  # TODO: Get from auth
        model=request.model,
        max_iterations=request.max_iterations,
        conversation_id=conversation_id,
        sandbox_url=sandbox_url,
        sandbox_api_key=sandbox_api_key,
        execution_mode=execution_mode,
    )

    sessions[session_id] = {
        'state': state,
        'status': 'created',
        'created_at': datetime.utcnow().isoformat(),
    }

    logger.info(f'[API] Created session {session_id}, execution_mode={execution_mode}')

    return SessionResponse(
        session_id=session_id,
        status='created',
        created_at=sessions[session_id]['created_at'],
        execution_mode=execution_mode,
        binding_warning=binding_warning,
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


async def _handle_clarification_response(
    websocket: WebSocket, session: dict, session_id: str
) -> None:
    """
    Handle user clarification response when session is in awaiting_input state.

    This is called when a client reconnects to a session that's waiting for input.
    """
    while True:
        user_message = await websocket.receive_json()
        msg_type = user_message.get('type') or user_message.get('event')

        if msg_type == 'clarification:answer':
            answers = user_message.get('data', {}).get(
                'answers', user_message.get('answers', [])
            )
            logger.info(f'[WS] Received clarification answers: {len(answers)}')

            # Update session state with answers and mark as ready to resume
            session['clarification_answers'] = answers
            session['status'] = 'ready_to_resume'
            session.pop('pending_interrupt', None)

            await websocket.send_json(
                {
                    'event': 'clarification:received',
                    'session_id': session_id,
                    'answers_count': len(answers),
                }
            )
            # Note: Graph will need to be resumed by the original connection
            # or a new stream call. This prevents infinite restarts.
            return
        elif msg_type == 'clarification:skip':
            logger.info('[WS] User skipped clarification')
            session['clarification_answers'] = []
            session['clarification_skipped'] = True
            session['status'] = 'ready_to_resume'
            session.pop('pending_interrupt', None)

            await websocket.send_json(
                {
                    'event': 'clarification:skipped',
                    'session_id': session_id,
                }
            )
            return
        elif msg_type == 'ping':
            await websocket.send_json({'event': 'pong'})
        else:
            logger.warning(f'[WS] Unknown message type during HITL wait: {msg_type}')


@router.websocket('/sessions/{session_id}/stream')
async def stream_session(websocket: WebSocket, session_id: str) -> None:
    """
    WebSocket endpoint for real-time session streaming.

    Streams agent thoughts and state updates as they happen.
    Handles reconnections gracefully - if session is awaiting_input,
    don't restart the graph, just wait for user response.
    """
    await websocket.accept()
    logger.info(f'[WS] Client connected to session {session_id}')

    if session_id not in sessions:
        await websocket.send_json({'error': 'Session not found'})
        await websocket.close()
        return

    session = sessions[session_id]
    state = session['state']
    current_status = session.get('status', 'pending')

    # If session is already awaiting user input, don't restart the graph
    # Just wait for the user's clarification response
    if current_status == 'awaiting_input':
        logger.info(f'[WS] Session {session_id} is awaiting_input, waiting for user response')
        await websocket.send_json({
            'event': 'awaiting_input',
            'session_id': session_id,
            'message': 'Session is waiting for your clarification response',
        })

        # Get pending interrupt data from session if available
        pending_interrupt = session.get('pending_interrupt')
        if pending_interrupt:
            await websocket.send_json({
                'event': 'interrupt',
                'type': pending_interrupt.get('type', 'clarification:questions'),
                **pending_interrupt,
            })

        # Wait for user clarification
        try:
            await _handle_clarification_response(websocket, session, session_id)
        except Exception as e:
            logger.error(f'[WS] Error handling clarification: {e}')
            await websocket.send_json({'event': 'error', 'message': str(e)})
        return

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
            # Handle interrupt chunks (HITL)
            # When interrupt() is called, chunk contains '__interrupt__' key
            if '__interrupt__' in chunk:
                interrupts = chunk['__interrupt__']
                for intr in interrupts:
                    # Extract interrupt payload (the value passed to interrupt())
                    payload = intr.value if hasattr(intr, 'value') else intr
                    logger.info(f'[WS] Interrupt received: {type(payload)}')

                    # Send interrupt event to frontend
                    if isinstance(payload, dict):
                        # Forward the interrupt payload as-is (e.g., clarification questions)
                        await websocket.send_json(
                            {
                                'event': 'interrupt',
                                'type': payload.get('type', 'unknown'),
                                **payload,
                            }
                        )
                    else:
                        await websocket.send_json(
                            {
                                'event': 'interrupt',
                                'type': 'generic',
                                'value': str(payload),
                            }
                        )

                # Update session status to waiting for user input
                session['status'] = 'awaiting_input'
                # Store the interrupt payload so reconnections can resend it
                if isinstance(payload, dict):
                    session['pending_interrupt'] = payload
                else:
                    session['pending_interrupt'] = {'type': 'generic', 'value': str(payload)}

                # HITL: Wait for user response via WebSocket
                # Keep connection open and wait for clarification:answer or clarification:skip
                logger.info('[WS] Waiting for user clarification response...')
                resume_value: Any = None
                try:
                    while True:
                        user_message = await websocket.receive_json()
                        msg_type = user_message.get('type') or user_message.get('event')

                        if msg_type == 'clarification:answer':
                            answers = user_message.get('answers', [])
                            logger.info(
                                f'[WS] Received clarification answers: {len(answers)}'
                            )
                            resume_value = {'answers': answers, 'skipped': False}
                            session['status'] = 'running'
                            break
                        elif msg_type == 'clarification:skip':
                            logger.info('[WS] User skipped clarification')
                            resume_value = {'answers': [], 'skipped': True}
                            session['status'] = 'running'
                            break
                        elif msg_type == 'ping':
                            await websocket.send_json({'event': 'pong'})
                        else:
                            logger.warning(
                                f'[WS] Unknown message type during HITL: {msg_type}'
                            )

                except Exception as hitl_error:
                    logger.error(f'[WS] HITL error: {hitl_error}')
                    session['status'] = 'error'
                    await websocket.send_json(
                        {
                            'event': 'error',
                            'message': f'Clarification error: {hitl_error}',
                        }
                    )
                    return

                # Resume graph execution with Command(resume=...)
                # This continues the graph from where it was interrupted
                logger.info(f'[WS] Resuming graph with: {resume_value}')
                session.pop('pending_interrupt', None)
                await websocket.send_json({
                    'event': 'clarification:resumed',
                    'session_id': session_id,
                })

                # Continue streaming with resumed execution
                async for resume_chunk in graph.astream(
                    Command(resume=resume_value), config
                ):
                    # Process resumed chunks the same way
                    if '__interrupt__' in resume_chunk:
                        # Another interrupt - recursively handle
                        logger.warning('[WS] Nested interrupt during resume - not supported yet')
                        continue
                    for node_name, node_state in resume_chunk.items():
                        if not isinstance(node_state, dict):
                            continue
                        thought = node_state.get('thought') or node_state.get('thoughts')
                        if thought:
                            await websocket.send_json({
                                'event': 'thought',
                                'node': node_name,
                                'thought': thought,
                            })
                        if node_state.get('error'):
                            await websocket.send_json({
                                'event': 'error',
                                'node': node_name,
                                'error': node_state['error'],
                            })

                # After resume completes, we're done with this chunk
                continue

            # Extract node name and state update
            for node_name, node_state in chunk.items():
                # Skip non-dict values (safety check)
                if not isinstance(node_state, dict):
                    logger.warning(
                        f'[WS] Unexpected node_state type: {type(node_state)}'
                    )
                    continue

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
