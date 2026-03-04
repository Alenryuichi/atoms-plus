"""
Atoms Plus Warm Pool - Runtime 预热池

提供预先初始化的 runtime 实例，消除用户创建新对话时的启动等待时间。

架构设计：
1. WarmPoolManager - 管理预热实例池的生命周期
2. WarmRuntime - 封装预热的 runtime 实例状态
3. 后台任务 - 自动补充已消耗的预热实例

使用方式：
    from atoms_plus.warm_pool import warm_pool_manager
    
    # 获取一个预热好的 runtime
    warm_runtime = await warm_pool_manager.acquire()
    
    # 如果没有可用的预热 runtime，返回 None
    if warm_runtime is None:
        # 回退到正常的 runtime 创建流程
        ...
"""

from .manager import WarmPoolManager, warm_pool_manager
from .models import WarmRuntime, WarmPoolConfig, WarmPoolStatus

__all__ = [
    "WarmPoolManager",
    "warm_pool_manager", 
    "WarmRuntime",
    "WarmPoolConfig",
    "WarmPoolStatus",
]

