"""
Race Mode API - FastAPI 路由

提供 REST API 接口供前端调用
注意：路由前缀改为 /race（不含 /api），因为会在 atoms_server.py 中添加 /api/v1 前缀
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .coordinator import RaceCoordinator
from .result_selector import ResultSelector, SelectionCriteria

# 注意：不再使用 /api/race 前缀，因为会在 atoms_server.py 中添加
router = APIRouter(prefix="/race", tags=["Race Mode"])

# 全局协调器实例
_coordinator: RaceCoordinator | None = None


def get_coordinator() -> RaceCoordinator:
    global _coordinator
    if _coordinator is None:
        _coordinator = RaceCoordinator()
    return _coordinator


# ==================== Pydantic Models ====================


class RaceRequest(BaseModel):
    """竞速请求"""

    prompt: str
    models: list[str] | None = None
    context: str = ""
    system_prompt: str | None = None


class RaceResultResponse(BaseModel):
    """单个结果响应"""

    model_name: str
    response: str
    execution_time: float
    token_count: int
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    cost_estimate: float
    quality_score: float
    error: str | None = None


class RaceResponse(BaseModel):
    """竞速响应"""

    session_id: str
    results: list[RaceResultResponse]
    total_cost: float = 0.0
    winner: RaceResultResponse | None = None


class SelectBestRequest(BaseModel):
    """选择最佳请求"""

    session_id: str
    criteria: str = "balanced"  # code_quality, speed, cost, balanced


# ==================== API Endpoints ====================


@router.post("/start", response_model=RaceResponse)
async def start_race(request: RaceRequest):
    """启动竞速模式 - 同时调用多个 LLM，返回所有结果"""
    coordinator = get_coordinator()

    if request.models:
        coordinator.models = request.models

    results = await coordinator.run(
        prompt=request.prompt,
        context=request.context,
        system_prompt=request.system_prompt,
    )

    if not results:
        raise HTTPException(status_code=500, detail="No results from any model")

    # 获取最新会话
    sessions = list(coordinator._sessions.values())
    if not sessions:
        raise HTTPException(status_code=500, detail="Session not found")

    session = sessions[-1]

    return RaceResponse(
        session_id=session.session_id,
        total_cost=session.total_cost,
        results=[
            RaceResultResponse(
                model_name=r.model_name,
                response=r.response,
                execution_time=r.execution_time,
                token_count=r.token_count,
                prompt_tokens=r.prompt_tokens,
                completion_tokens=r.completion_tokens,
                cost_estimate=r.cost_estimate,
                quality_score=r.quality_score,
                error=r.error,
            )
            for r in results
        ],
    )


@router.post("/select-best", response_model=RaceResultResponse)
async def select_best_result(request: SelectBestRequest):
    """从竞速结果中选择最佳答案"""
    coordinator = get_coordinator()
    session = coordinator.get_session(request.session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        criteria = SelectionCriteria(request.criteria)
    except ValueError:
        criteria = SelectionCriteria.BALANCED

    selector = ResultSelector(criteria=criteria)
    best = selector.select_best(session.results)

    if not best:
        raise HTTPException(status_code=404, detail="No results to select from")

    session.winner = best

    return RaceResultResponse(
        model_name=best.model_name,
        response=best.response,
        execution_time=best.execution_time,
        token_count=best.token_count,
        prompt_tokens=best.prompt_tokens,
        completion_tokens=best.completion_tokens,
        cost_estimate=best.cost_estimate,
        quality_score=best.quality_score,
        error=best.error,
    )


@router.get("/models")
async def list_supported_models():
    """列出支持的模型"""
    return {
        "models": list(RaceCoordinator.SUPPORTED_MODELS.keys()),
        "details": RaceCoordinator.SUPPORTED_MODELS,
    }


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """获取会话详情"""
    coordinator = get_coordinator()
    session = coordinator.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session.session_id,
        "prompt": session.prompt,
        "models": session.models,
        "results_count": len(session.results),
        "total_cost": session.total_cost,
        "has_winner": session.winner is not None,
        "created_at": session.created_at,
    }

