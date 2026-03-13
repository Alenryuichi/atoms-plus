"""FastAPI router for Deep Research API endpoints.

This module provides:
- POST /research: Execute research and return complete report
- POST /research/save-report: Write a completed report into a sandbox workspace
- WebSocket /research/stream: Execute research with real-time progress updates
"""

from __future__ import annotations

import asyncio
import logging
import os
import re

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from atoms_plus.deep_research.models import (
    ResearchProgress,
    ResearchRequest,
    ResearchResponse,
    SaveReportRequest,
    SaveReportResponse,
)
from atoms_plus.deep_research.research import deep_research_async

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Deep Research"])

# Base directory where ProcessSandboxService creates sandbox working dirs.
# Mirrors the default in ProcessSandboxServiceInjector.base_working_dir.
# Can be overridden with the OH_SANDBOX_BASE_WORKING_DIR env var.
_SANDBOX_BASE_DIR = os.environ.get(
    "OH_SANDBOX_BASE_WORKING_DIR", "/tmp/openhands-sandboxes"
)

# Runtimes where save-report can directly write to the host filesystem.
# Daytona / remote / docker sandboxes are cloud-based or containerised —
# the host process has no local access to the sandbox filesystem.
_LOCAL_RUNTIMES = {"local", "e2b", "modal", "runloop"}

# Pattern for acceptable sandbox IDs (hex / UUID / alphanumeric-dash)
_SANDBOX_ID_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_\-]{0,127}$")


# =============================================================================
# REST API Endpoints
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


@router.post("/research/save-report", response_model=SaveReportResponse)
async def save_report(request: SaveReportRequest) -> SaveReportResponse:
    """Write a completed research report into a sandbox workspace.

    This is called by the frontend AFTER research completes and after the
    conversation (and therefore the sandbox) has been created.  The report
    is written to ``{sandbox_working_dir}/{filename}`` on the host; from
    inside the sandbox the agent sees it at ``/workspace/{filename}``.

    **Runtime limitation:** This endpoint only works with local-process
    runtimes (``RUNTIME`` ∈ local / e2b / modal / runloop / unset).
    For Daytona, remote, or Docker runtimes the host has no direct access
    to the sandbox filesystem.

    Args:
        request: sandbox_id + report content + optional filename

    Returns:
        SaveReportResponse with host_path and sandbox_path on success
    """
    # ── Runtime guard ────────────────────────────────────────────────
    # Only local-process runtimes have host-accessible sandbox dirs.
    # Default to "local" when RUNTIME is unset — matches the common
    # dev-server setup where ProcessSandboxService is used.
    current_runtime = os.environ.get("RUNTIME", "local").lower()
    if current_runtime not in _LOCAL_RUNTIMES:
        logger.info(
            f"save-report not supported for RUNTIME={current_runtime!r}"
        )
        return SaveReportResponse(
            success=False,
            error=(
                f"save-report is not supported for RUNTIME={current_runtime}. "
                "Only local process runtimes (local/e2b/modal/runloop) are currently supported."
            ),
        )

    # ── sandbox_id format guard ──────────────────────────────────────
    if not _SANDBOX_ID_RE.match(request.sandbox_id):
        logger.warning(f"Invalid sandbox_id format: {request.sandbox_id!r}")
        return SaveReportResponse(
            success=False,
            error="Invalid sandbox ID format",
        )

    # ── Path resolution with traversal protection ────────────────────
    sandbox_dir = os.path.join(_SANDBOX_BASE_DIR, request.sandbox_id)
    host_path = os.path.join(sandbox_dir, request.filename)

    # Canonicalise and ensure the resolved path is still under _SANDBOX_BASE_DIR
    real_base = os.path.realpath(_SANDBOX_BASE_DIR)
    real_host_path = os.path.realpath(host_path)
    real_sandbox_dir = os.path.realpath(sandbox_dir)

    if not real_sandbox_dir.startswith(real_base + os.sep) and real_sandbox_dir != real_base:
        logger.warning(
            f"Path traversal blocked: sandbox_dir={sandbox_dir!r} "
            f"resolved to {real_sandbox_dir!r}"
        )
        return SaveReportResponse(
            success=False, error="Invalid sandbox ID"
        )

    if not real_host_path.startswith(real_sandbox_dir + os.sep) and real_host_path != real_sandbox_dir:
        logger.warning(
            f"Path traversal blocked: host_path={host_path!r} "
            f"resolved to {real_host_path!r}"
        )
        return SaveReportResponse(
            success=False, error="Invalid filename"
        )

    # ── Validate that the sandbox directory actually exists ───────────
    if not os.path.isdir(real_sandbox_dir):
        logger.warning(f"Sandbox dir not found: {real_sandbox_dir}")
        return SaveReportResponse(
            success=False,
            error=f"Sandbox directory not found: {request.sandbox_id}",
        )

    # ── Write report ─────────────────────────────────────────────────
    try:
        with open(real_host_path, "w", encoding="utf-8") as f:
            f.write(request.report)

        sandbox_path = f"/workspace/{request.filename}"
        logger.info(
            f"Report saved: {real_host_path} ({len(request.report)} chars), "
            f"sandbox view: {sandbox_path}"
        )
        return SaveReportResponse(
            success=True,
            host_path=real_host_path,
            sandbox_path=sandbox_path,
        )
    except OSError as e:
        logger.error(f"Failed to write report to {real_host_path}: {e}")
        return SaveReportResponse(
            success=False,
            error=str(e),
        )


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

    research_task: asyncio.Task | None = None
    heartbeat_task: asyncio.Task | None = None
    client_disconnected = False

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

        # Progress callback — raises on closed connection so the task
        # sees the cancellation promptly
        async def send_progress(progress: ResearchProgress):
            if client_disconnected:
                raise asyncio.CancelledError
            await websocket.send_json(progress.model_dump(exclude_none=True))

        # Heartbeat: send {"event":"ping"} every 15s to keep connection alive
        # during long non-streaming LLM calls (e.g. Stage 2 parallel sections)
        async def heartbeat():
            try:
                while not client_disconnected:
                    await asyncio.sleep(15)
                    if not client_disconnected:
                        await websocket.send_json({"event": "ping"})
            except (asyncio.CancelledError, Exception):
                pass

        heartbeat_task = asyncio.create_task(heartbeat())

        # Run research as a separately cancellable task so disconnect
        # can abort in-flight LLM calls instead of just setting a flag
        async def _run_research() -> ResearchResponse:
            return await deep_research_async(
                query=request.query,
                max_rounds=request.max_rounds,
                search_engine=request.search_engine.value,
                language=request.language,
                on_progress=send_progress,
            )

        research_task = asyncio.create_task(_run_research())
        result = await research_task

        heartbeat_task.cancel()

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
        client_disconnected = True
        logger.info("WebSocket disconnected by client — cancelling research task")
        if research_task and not research_task.done():
            research_task.cancel()
    except asyncio.CancelledError:
        logger.info("Research task cancelled (client disconnect)")
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
        if heartbeat_task and not heartbeat_task.done():
            heartbeat_task.cancel()
        if research_task and not research_task.done():
            research_task.cancel()
        try:
            await websocket.close()
        except Exception:
            pass


__all__ = ["router"]
