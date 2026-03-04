"""
Warm Pool 数据模型
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel


class WarmRuntimeState(str, Enum):
    """预热 runtime 的状态"""
    INITIALIZING = "initializing"  # 正在初始化
    READY = "ready"                # 就绪，可分配
    ASSIGNED = "assigned"          # 已分配给用户
    EXPIRED = "expired"            # 过期，待清理
    ERROR = "error"                # 初始化失败


@dataclass
class WarmRuntime:
    """
    预热的 Runtime 实例
    
    封装了一个已经完成初始化的 runtime，可以直接分配给新用户
    """
    pool_id: str                    # 池内唯一标识
    state: WarmRuntimeState         # 当前状态
    created_at: datetime            # 创建时间
    ready_at: datetime | None = None  # 就绪时间
    assigned_at: datetime | None = None  # 分配时间
    conversation_id: str | None = None   # 分配后关联的会话ID
    user_id: str | None = None           # 分配后关联的用户ID
    
    # Runtime 相关对象（延迟填充）
    session: Any = None             # Session 对象
    runtime: Any = None             # Runtime 对象
    event_stream: Any = None        # EventStream 对象
    
    # 统计信息
    initialization_time_ms: int = 0  # 初始化耗时（毫秒）
    
    def is_available(self) -> bool:
        """检查是否可用于分配"""
        return self.state == WarmRuntimeState.READY
    
    def mark_ready(self) -> None:
        """标记为就绪状态"""
        self.state = WarmRuntimeState.READY
        self.ready_at = datetime.utcnow()
        if self.created_at:
            self.initialization_time_ms = int(
                (self.ready_at - self.created_at).total_seconds() * 1000
            )
    
    def assign(self, conversation_id: str, user_id: str | None) -> None:
        """分配给用户"""
        self.state = WarmRuntimeState.ASSIGNED
        self.assigned_at = datetime.utcnow()
        self.conversation_id = conversation_id
        self.user_id = user_id


class WarmPoolConfig(BaseModel):
    """
    预热池配置
    """
    # 池大小配置
    min_pool_size: int = 1          # 最小预热实例数（始终保持）
    max_pool_size: int = 2          # 最大预热实例数（资源限制）
    
    # 生命周期配置
    max_idle_time_seconds: int = 300    # 最大空闲时间（5分钟）
    max_lifetime_seconds: int = 600     # 最大生命周期（10分钟）
    
    # 补充策略
    replenish_delay_seconds: float = 5.0  # 实例被消耗后，延迟多久开始补充
    
    # 资源限制（Railway Trial Plan）
    enabled: bool = True            # 是否启用预热池
    
    class Config:
        env_prefix = "WARM_POOL_"


class WarmPoolStatus(BaseModel):
    """
    预热池状态（用于 API 响应）
    """
    enabled: bool
    total_instances: int
    ready_instances: int
    initializing_instances: int
    assigned_instances: int
    
    # 配置信息
    min_pool_size: int
    max_pool_size: int
    
    # 统计信息
    total_acquisitions: int = 0         # 总获取次数
    successful_acquisitions: int = 0    # 成功获取次数（从池中）
    fallback_acquisitions: int = 0      # 回退获取次数（创建新的）
    avg_initialization_time_ms: float = 0.0  # 平均初始化时间
    
    # 实例详情
    instances: list[dict] = field(default_factory=list)

