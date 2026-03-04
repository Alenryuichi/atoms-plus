"""
Atoms Plus Warm Pool - Runtime 预热池状态监控

本模块作为 OpenHands LocalRuntime 内置 warm server 功能的状态监控层。
实际的 warm server 管理由 LocalRuntime 负责，通过环境变量配置：
- INITIAL_NUM_WARM_SERVERS: 启动时创建的预热服务器数量
- DESIRED_NUM_WARM_SERVERS: 期望维持的预热服务器数量

使用方式：
    from atoms_plus.warm_pool import warm_pool_manager

    # 获取预热池状态
    status = warm_pool_manager.get_status()
    print(f"Ready instances: {status.ready_instances}")
"""

from .manager import WarmPoolManager, warm_pool_manager
from .models import WarmPoolConfig, WarmPoolStatus

__all__ = [
    "WarmPoolManager",
    "warm_pool_manager",
    "WarmPoolConfig",
    "WarmPoolStatus",
]

