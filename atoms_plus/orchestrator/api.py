# Atoms Plus - Orchestrator API
"""
FastAPI routes for multi-agent orchestration with real LLM integration.

Supports:
- Alibaba Qwen (百炼): openai/qwen-plus, openai/qwen-max
- DeepSeek: deepseek/deepseek-chat, deepseek/deepseek-coder
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from atoms_plus.orchestrator.dispatcher import TaskDispatcher
from atoms_plus.orchestrator.multi_agent import MultiAgentController
from atoms_plus.orchestrator.result_aggregator import ResultAggregator
from atoms_plus.roles import AgentRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/orchestrator", tags=["orchestrator"])

# Global instances
_dispatcher = TaskDispatcher()


class SubtaskRequest(BaseModel):
    role: str
    task: str
    context: str = ""
    expected_output: str = ""
    priority: int = 1


class DispatchRequest(BaseModel):
    subtasks: list[SubtaskRequest]
    model: str = Field(default="openai/qwen-plus", description="LLM model to use")
    parallel: bool = True
    timeout: float = 300.0
    max_tokens: int = 4096
    temperature: float = 0.7


class SuggestRoleRequest(BaseModel):
    task: str


@router.get("/")
async def orchestrator_info() -> dict[str, Any]:
    """Get orchestrator info, available roles, and supported LLM models."""
    return {
        "name": "Atoms Plus Orchestrator",
        "version": "2.0.0",
        "description": "Multi-role coordination with real LLM integration",
        "available_roles": [role.value for role in AgentRole],
        "supported_models": MultiAgentController.SUPPORTED_MODELS,
        "default_model": MultiAgentController.DEFAULT_MODEL,
        "endpoints": {
            "suggest_role": "POST /api/v1/orchestrator/suggest-role",
            "dispatch": "POST /api/v1/orchestrator/dispatch",
            "models": "GET /api/v1/orchestrator/models",
            "sessions": "GET /api/v1/orchestrator/sessions",
        },
    }


@router.get("/models")
async def list_models() -> dict[str, Any]:
    """List all supported LLM models."""
    return {
        "models": MultiAgentController.SUPPORTED_MODELS,
        "default": MultiAgentController.DEFAULT_MODEL,
        "providers": {
            "aliyun": ["openai/qwen-plus", "openai/qwen-max", "openai/qwen-turbo"],
            "deepseek": ["deepseek/deepseek-chat", "deepseek/deepseek-coder"],
        },
    }


@router.post("/suggest-role")
async def suggest_role(request: SuggestRoleRequest) -> dict[str, Any]:
    """Suggest the best role for a given task."""
    suggested = _dispatcher.suggest_role(request.task)
    return {
        "task": request.task,
        "suggested_role": suggested.value,
        "role_info": {
            "id": suggested.value,
            "capabilities": _dispatcher.ROLE_KEYWORDS.get(suggested, []),
        },
    }


@router.post("/dispatch")
async def dispatch_tasks(request: DispatchRequest) -> dict[str, Any]:
    """
    Dispatch subtasks to multiple roles using real LLM calls.

    Can run in parallel or sequential mode.
    Supports Alibaba Qwen and DeepSeek models.
    """
    try:
        # Create controller with requested model
        controller = MultiAgentController(
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        # Create subtasks
        subtasks = []
        for st in request.subtasks:
            subtask = _dispatcher.create_subtask(
                role=st.role,
                task=st.task,
                context=st.context,
                expected_output=st.expected_output,
                priority=st.priority,
            )
            subtasks.append(subtask)

        logger.info(f"Dispatching {len(subtasks)} subtasks using model: {request.model}")

        # Execute
        if request.parallel:
            results = await controller.run_parallel(
                subtasks,
                timeout=request.timeout
            )
        else:
            # Sequential execution (one by one)
            results = []
            for subtask in subtasks:
                result = await controller.run_parallel(
                    [subtask],
                    timeout=request.timeout
                )
                results.extend(result)

        # Aggregate results
        aggregated = ResultAggregator.merge_results(results)
        formatted = ResultAggregator.format_for_team_leader(aggregated)

        # Calculate total cost
        total_cost = sum(r.cost_estimate for r in results)
        total_tokens = sum(r.total_tokens for r in results)

        return {
            "status": "completed",
            "mode": "parallel" if request.parallel else "sequential",
            "model": request.model,
            "aggregated": aggregated.to_dict(),
            "formatted_summary": formatted,
            "metrics": {
                "total_tokens": total_tokens,
                "total_cost": total_cost,
                "subtasks_count": len(subtasks),
            },
        }

    except Exception as e:
        logger.error(f"Dispatch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def list_sessions() -> dict[str, Any]:
    """List all multi-agent sessions."""
    return {
        "sessions": [
            session.to_dict() 
            for session in _controller.sessions.values()
        ],
        "total": len(_controller.sessions),
    }


@router.get("/sessions/{session_id}")
async def get_session(session_id: str) -> dict[str, Any]:
    """Get details of a specific session."""
    session = _controller.sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()

