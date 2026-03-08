# Atoms Plus - Team Mode API
"""
FastAPI routes and WebSocket handlers for Team Mode.

Provides:
- REST endpoints for session management
- WebSocket endpoint for real-time streaming
- Integration with existing atoms_server.py
- OpenHands conversation integration for code execution

Supports both V0 and V1 OpenHands sessions:
- V0: Sessions run in main server process, use /message endpoint
- V1: Sessions run in separate sandboxes, use /events endpoint with SendMessageRequest
"""

from __future__ import annotations

import logging
import os
import uuid as uuid_module
from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from langgraph.types import Command
from pydantic import BaseModel, Field

from atoms_plus.team_mode.graph import (
    compile_team_graph,
    get_async_sqlite_checkpointer,
    get_session_state,
    list_saved_sessions,
)
from atoms_plus.team_mode.nodes.base import get_llm_config
from atoms_plus.team_mode.state import ExecutionMode, create_initial_state

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/api/v1/team', tags=['team-mode'])

# Lazy dependency resolution for V1 services (may not be available in V0-only mode)
_app_conversation_service_dependency = None
_sandbox_service_dependency = None


def _get_v1_dependencies():
    """Lazily resolve V1 dependencies to avoid import errors in V0-only mode."""
    global _app_conversation_service_dependency, _sandbox_service_dependency
    if _app_conversation_service_dependency is None:
        try:
            from openhands.app_server.config import (
                depends_app_conversation_service,
                depends_sandbox_service,
            )

            _app_conversation_service_dependency = depends_app_conversation_service()
            _sandbox_service_dependency = depends_sandbox_service()
        except Exception as e:
            logger.warning(f'[API] V1 dependencies not available: {e}')
    return _app_conversation_service_dependency, _sandbox_service_dependency


def _get_server_base_url(request: Request | None = None) -> str:
    """Get the base URL of the current server for V0 handoff.

    V0 sessions run in the main server process, so the handoff URL
    is the server's own URL.
    """
    # Check environment variables first
    backend_host = os.getenv('BACKEND_HOST', os.getenv('WEB_HOST', 'localhost'))
    backend_port = os.getenv('BACKEND_PORT', os.getenv('PORT', '3000'))
    use_tls = os.getenv('USE_TLS', 'false').lower() == 'true'
    protocol = 'https' if use_tls else 'http'

    # If request is available, use it to construct URL
    if request:
        return str(request.base_url).rstrip('/')

    return f'{protocol}://{backend_host}:{backend_port}'


# Request/Response Models
class StartSessionRequest(BaseModel):
    """Request to start a new Team Mode session."""

    task: str = Field(..., description='The task to accomplish')
    model: str | None = Field(
        default=None,
        description='LLM model to use (if not provided, uses user settings from ~/.openhands/settings.json)',
    )
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

# Track active graph executions to prevent concurrent runs
# Key: session_id, Value: True if execution is in progress
_active_executions: dict[str, bool] = {}


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
    http_request: Request,
) -> SessionResponse:
    """
    Create a new Team Mode session.

    If conversation_id is provided, the session will be bound to the existing
    OpenHands conversation and can execute code via CodeActAgent handoff.

    Supports both V0 and V1 conversations:
    - V0: Sessions run in main server, handoff uses /message endpoint
    - V1: Sessions run in sandboxes, handoff uses /events endpoint
    """
    session_id = str(uuid_module.uuid4())

    # Initialize sandbox info (will be populated if conversation_id is provided)
    conversation_id: str | None = None
    sandbox_url: str | None = None
    sandbox_api_key: str | None = None
    execution_mode = ExecutionMode.PLAN_ONLY.value
    binding_warning: str | None = None
    conversation_version: str = 'V0'  # Default to V0

    # If conversation_id provided, lookup sandbox info
    if request.conversation_id:
        conversation_id = request.conversation_id

        # Try V1 first (AppConversationService)
        v1_bound = False
        app_conv_dep, sandbox_dep = _get_v1_dependencies()

        if app_conv_dep and sandbox_dep:
            try:
                # Resolve dependencies
                app_conversation_service = await app_conv_dep()
                sandbox_service = await sandbox_dep()

                conv_uuid = UUID(request.conversation_id)
                conversation = await app_conversation_service.get_app_conversation(
                    conv_uuid
                )

                if conversation:
                    # This is a V1 conversation
                    conversation_version = 'V1'
                    sandbox = await sandbox_service.get_sandbox(conversation.sandbox_id)
                    if sandbox:
                        sandbox_api_key = sandbox.session_api_key
                        # Build sandbox URL from conversation_url
                        if conversation.conversation_url:
                            url_parts = conversation.conversation_url.rsplit('/api/', 1)
                            sandbox_url = url_parts[0] if url_parts else None
                        execution_mode = ExecutionMode.EXECUTE.value
                        v1_bound = True
                        logger.info(
                            f'[API] Bound to V1 conversation {conversation_id}, '
                            f'sandbox_url={sandbox_url}'
                        )
            except Exception as e:
                logger.debug(f'[API] V1 lookup failed (may be V0): {e}')

        # If V1 lookup failed, assume V0 session
        if not v1_bound:
            # V0 sessions run in the main server process
            # The handoff URL is the server's own URL
            conversation_version = 'V0'
            sandbox_url = _get_server_base_url(http_request)
            sandbox_api_key = None  # V0 doesn't require API key for local access
            execution_mode = ExecutionMode.EXECUTE.value
            logger.info(
                f'[API] Bound to V0 conversation {conversation_id}, '
                f'server_url={sandbox_url}'
            )

    # Get model from request or user settings
    model = request.model
    if not model:
        llm_config = get_llm_config()
        model = llm_config['model']
        logger.info(f'[API] Using model from user settings: {model}')

    # Create initial state with sandbox info
    state = create_initial_state(
        task=request.task,
        session_id=session_id,
        user_id='anonymous',  # TODO: Get from auth
        model=model,
        max_iterations=request.max_iterations,
        conversation_id=conversation_id,
        conversation_version=conversation_version,
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

    IMPORTANT: Only one execution per session is allowed at a time.
    Additional WebSocket connections will receive status updates but won't
    trigger new graph executions.
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
        logger.info(
            f'[WS] Session {session_id} is awaiting_input, waiting for user response'
        )
        await websocket.send_json(
            {
                'event': 'awaiting_input',
                'session_id': session_id,
                'message': 'Session is waiting for your clarification response',
            }
        )

        # Get pending interrupt data from session if available
        pending_interrupt = session.get('pending_interrupt')
        if pending_interrupt:
            await websocket.send_json(
                {
                    'event': 'interrupt',
                    'type': pending_interrupt.get('type', 'clarification:questions'),
                    **pending_interrupt,
                }
            )

        # Wait for user clarification
        try:
            await _handle_clarification_response(websocket, session, session_id)
        except Exception as e:
            logger.error(f'[WS] Error handling clarification: {e}')
            await websocket.send_json({'event': 'error', 'message': str(e)})
        return

    # Check if execution is already in progress for this session
    if _active_executions.get(session_id):
        logger.warning(
            f'[WS] Execution already in progress for session {session_id}, ignoring'
        )
        await websocket.send_json(
            {
                'event': 'already_running',
                'session_id': session_id,
                'message': 'Graph execution is already in progress for this session',
            }
        )
        # Keep connection open but don't start new execution
        try:
            while True:
                msg = await websocket.receive_json()
                if msg.get('type') == 'ping':
                    await websocket.send_json({'event': 'pong'})
        except WebSocketDisconnect:
            logger.info(f'[WS] Observer disconnected from session {session_id}')
        except Exception:
            pass
        return

    # Mark execution as active
    _active_executions[session_id] = True

    try:
        # Compile graph with async checkpointer
        checkpointer = await get_async_sqlite_checkpointer()
        # Enable HITL clarification flow
        graph = compile_team_graph(checkpointer, enable_clarification=True)

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
                    session['pending_interrupt'] = {
                        'type': 'generic',
                        'value': str(payload),
                    }

                # HITL: Wait for user response via WebSocket
                # Keep connection open and wait for clarification:answer or clarification:skip
                logger.info('[WS] Waiting for user clarification response...')
                resume_value: Any = None
                try:
                    while True:
                        user_message = await websocket.receive_json()
                        msg_type = user_message.get('type') or user_message.get('event')

                        if msg_type == 'clarification:answer':
                            # Frontend sends answers in data.answers, fallback to top-level
                            answers = user_message.get('data', {}).get(
                                'answers', user_message.get('answers', [])
                            )
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
                await websocket.send_json(
                    {
                        'event': 'clarification:resumed',
                        'session_id': session_id,
                    }
                )

                # Continue streaming with resumed execution
                async for resume_chunk in graph.astream(
                    Command(resume=resume_value), config
                ):
                    # Process resumed chunks the same way
                    if '__interrupt__' in resume_chunk:
                        # Another interrupt - recursively handle
                        logger.warning(
                            '[WS] Nested interrupt during resume - not supported yet'
                        )
                        continue
                    for node_name, node_state in resume_chunk.items():
                        if not isinstance(node_state, dict):
                            continue
                        thought = node_state.get('thought') or node_state.get(
                            'thoughts'
                        )
                        if thought:
                            await websocket.send_json(
                                {
                                    'event': 'thought',
                                    'node': node_name,
                                    'thought': thought,
                                }
                            )
                        if node_state.get('error'):
                            await websocket.send_json(
                                {
                                    'event': 'error',
                                    'node': node_name,
                                    'error': node_state['error'],
                                }
                            )

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

                # Send thought updates (only summary to UI, not full details)
                thoughts = node_state.get('thoughts', [])
                if thoughts:
                    latest = thoughts[-1]
                    # Use summary if available, otherwise use first 100 chars of content
                    summary = latest.get('summary') or latest.get('content', '')[:100]
                    await websocket.send_json(
                        {
                            'event': 'thought',
                            'agent': latest.get('role'),
                            'content': summary,  # Summary only for UI
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
        try:
            await websocket.send_json({'event': 'error', 'message': str(e)})
        except Exception:
            pass  # Connection may already be closed
    finally:
        # Clear execution flag so new executions can start
        _active_executions.pop(session_id, None)
        try:
            await websocket.close()
        except Exception:
            pass  # May already be closed
