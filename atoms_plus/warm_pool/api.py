"""
Warm Pool API - 预热池状态监控接口

提供 LocalRuntime 内置 warm server 功能的状态查询 API。

注意：实际的 warm server 管理由 LocalRuntime 负责，
此 API 仅用于状态监控和前端显示。

环境变量配置（在 Railway 设置）：
- INITIAL_NUM_WARM_SERVERS: 启动时创建的预热服务器数量
- DESIRED_NUM_WARM_SERVERS: 期望维持的预热服务器数量
"""

import os

from fastapi import APIRouter

from .manager import warm_pool_manager
from .models import WarmPoolConfig, WarmPoolStatus

router = APIRouter(prefix="/warm-pool", tags=["Warm Pool"])


@router.get("/status", response_model=WarmPoolStatus)
async def get_warm_pool_status() -> WarmPoolStatus:
    """
    获取预热池状态

    返回 LocalRuntime 内置 warm server 的当前状态
    """
    return warm_pool_manager.get_status()


@router.get("/config")
async def get_warm_pool_config():
    """
    获取预热池配置

    返回环境变量中的 warm server 配置
    """
    return {
        "initial_num_warm_servers": int(os.getenv("INITIAL_NUM_WARM_SERVERS", "0")),
        "desired_num_warm_servers": int(os.getenv("DESIRED_NUM_WARM_SERVERS", "0")),
        "note": "Configure via INITIAL_NUM_WARM_SERVERS and DESIRED_NUM_WARM_SERVERS env vars",
    }


@router.get("/health")
async def warm_pool_health():
    """
    预热池健康检查

    用于前端轮询显示 warm server 状态
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

    return {
        "healthy": is_healthy,
        "enabled": status.enabled,
        "ready_instances": status.ready_instances,
        "min_pool_size": status.min_pool_size,
        "desired_pool_size": status.max_pool_size,
        "issues": issues,
    }

