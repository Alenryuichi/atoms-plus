"""FastAPI router for Deep Research API endpoints.

This module provides:
- POST /research: Execute research and return complete report
- WebSocket /research/stream: Execute research with real-time progress updates
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from atoms_plus.deep_research.models import (
    ResearchProgress,
    ResearchRequest,
    ResearchResponse,
)
from atoms_plus.deep_research.research import deep_research_async

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Deep Research"])


# =============================================================================
# REST API Endpoint
# =============================================================================


@router.post("/research", response_model=ResearchResponse)
async def execute_research(request: ResearchRequest) -> ResearchResponse:
    """Execute deep research on a topic.

    This endpoint performs multi-round search and LLM analysis
    to generate a comprehensive research report.

    Args:
        request: Research request with query and options

    Returns:
        Complete research response with report and metadata
    """
    logger.info(f"Research request: {request.query}")

    result = await deep_research_async(
        query=request.query,
        max_rounds=request.max_rounds,
        search_engine=request.search_engine.value,
        language=request.language,
    )

    logger.info(
        f"Research complete: {result.session_id}, "
        f"{len(result.report)} chars, {result.execution_time:.1f}s"
    )

    return result


# =============================================================================
# WebSocket Streaming Endpoint
# =============================================================================


@router.websocket("/research/stream")
async def research_stream(websocket: WebSocket):
    """WebSocket endpoint for real-time research progress.

    Connect and send a JSON message with research parameters:
    {
        "query": "Research topic",
        "max_rounds": 2,
        "search_engine": "auto",
        "language": "auto"
    }

    Server will send progress events as JSON:
    {
        "event": "started|section_started|searching|...|completed",
        "session_id": "abc12345",
        "current_section": "...",
        "progress": 0.5,
        "message": "..."
    }

    Final message contains the complete report in the message field.
    """
    await websocket.accept()
    logger.info("WebSocket connection accepted")

    try:
        # Receive research request
        data = await websocket.receive_json()
        logger.info(f"WebSocket request: {data}")

        # Validate request
        try:
            request = ResearchRequest(**data)
        except ValidationError as e:
            await websocket.send_json(
                {
                    "event": "error",
                    "message": f"Invalid request: {e.errors()}",
                }
            )
            await websocket.close()
            return

        # Progress callback
        async def send_progress(progress: ResearchProgress):
            await websocket.send_json(progress.model_dump())

        # Execute research with progress streaming
        result = await deep_research_async(
            query=request.query,
            max_rounds=request.max_rounds,
            search_engine=request.search_engine.value,
            language=request.language,
            on_progress=send_progress,
        )

        # Send final result
        await websocket.send_json(
            {
                "event": "result",
                "session_id": result.session_id,
                "report": result.report,
                "total_sources": result.total_sources,
                "execution_time": result.execution_time,
                "search_engine_used": result.search_engine_used,
            }
        )

        logger.info(f"WebSocket research complete: {result.session_id}")

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected by client")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json(
                {
                    "event": "error",
                    "message": str(e),
                }
            )
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


__all__ = ["router"]
