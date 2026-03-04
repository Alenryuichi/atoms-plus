"""
Warm Pool API - 预热池管理接口

提供预热池状态查询和管理的 REST API
"""

from fastapi import APIRouter, HTTPException

from .manager import warm_pool_manager
from .models import WarmPoolConfig, WarmPoolStatus

router = APIRouter(prefix="/warm-pool", tags=["Warm Pool"])


@router.get("/status", response_model=WarmPoolStatus)
async def get_warm_pool_status() -> WarmPoolStatus:
    """
    获取预热池状态
    
    返回预热池的当前状态，包括：
    - 实例数量统计
    - 配置信息
    - 性能统计
    """
    return warm_pool_manager.get_status()


@router.get("/config", response_model=WarmPoolConfig)
async def get_warm_pool_config() -> WarmPoolConfig:
    """
    获取预热池配置
    """
    return warm_pool_manager.config


@router.post("/start")
async def start_warm_pool():
    """
    启动预热池
    
    开始预热 runtime 实例
    """
    try:
        await warm_pool_manager.start()
        return {"status": "ok", "message": "Warm pool started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_warm_pool():
    """
    停止预热池
    
    停止预热并清理所有预热实例
    """
    try:
        await warm_pool_manager.stop()
        return {"status": "ok", "message": "Warm pool stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/replenish")
async def replenish_warm_pool():
    """
    手动触发预热池补充
    
    强制检查并补充预热实例到 min_pool_size
    """
    try:
        await warm_pool_manager._ensure_min_pool_size()
        return {
            "status": "ok",
            "message": "Replenish triggered",
            "current_status": warm_pool_manager.get_status().model_dump(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def warm_pool_health():
    """
    预热池健康检查
    """
    status = warm_pool_manager.get_status()
    
    # 判断健康状态
    is_healthy = True
    issues = []
    
    if status.enabled and status.ready_instances == 0:
        is_healthy = False
        issues.append("No ready instances available")
    
    if status.enabled and status.ready_instances < status.min_pool_size:
        issues.append(
            f"Ready instances ({status.ready_instances}) below min pool size ({status.min_pool_size})"
        )
    
    # 计算命中率
    hit_rate = (
        status.successful_acquisitions / status.total_acquisitions * 100
        if status.total_acquisitions > 0 else 0
    )
    
    return {
        "healthy": is_healthy,
        "enabled": status.enabled,
        "ready_instances": status.ready_instances,
        "hit_rate_percent": round(hit_rate, 2),
        "avg_init_time_ms": round(status.avg_initialization_time_ms, 2),
        "issues": issues,
    }

