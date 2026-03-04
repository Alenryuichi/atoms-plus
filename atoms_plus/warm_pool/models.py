"""
Warm Pool 数据模型

用于 LocalRuntime 内置 warm server 功能的状态监控
"""

from typing import Any

from pydantic import BaseModel, Field


class WarmPoolConfig(BaseModel):
    """
    预热池配置

    注意：实际配置通过环境变量设置：
    - INITIAL_NUM_WARM_SERVERS
    - DESIRED_NUM_WARM_SERVERS
    """
    min_pool_size: int = 0
    max_pool_size: int = 0
    enabled: bool = False


class WarmPoolStatus(BaseModel):
    """
    预热池状态（用于 API 响应）

    读取自 LocalRuntime 的 _WARM_SERVERS 状态
    """
    enabled: bool
    total_instances: int
    ready_instances: int
    initializing_instances: int
    assigned_instances: int

    # 配置信息（从环境变量读取）
    min_pool_size: int  # INITIAL_NUM_WARM_SERVERS
    max_pool_size: int  # DESIRED_NUM_WARM_SERVERS

    # 统计信息（LocalRuntime 不暴露这些，保留用于兼容性）
    total_acquisitions: int = 0
    successful_acquisitions: int = 0
    fallback_acquisitions: int = 0
    avg_initialization_time_ms: float = 0.0

    # 实例详情
    instances: list[dict[str, Any]] = Field(default_factory=list)

