"""
Warm Pool Manager - 预热池管理器

核心功能：
1. 管理预热 runtime 实例的生命周期
2. 提供快速获取预热实例的接口
3. 后台自动补充已消耗的实例
4. 清理过期/空闲实例
"""

import asyncio
import os
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from openhands.core.logger import openhands_logger as logger

from .models import WarmPoolConfig, WarmPoolStatus, WarmRuntime, WarmRuntimeState

if TYPE_CHECKING:
    from openhands.storage.data_models.settings import Settings


class WarmPoolManager:
    """
    预热池管理器
    
    使用单例模式，在应用启动时初始化并开始预热
    """
    
    _instance: "WarmPoolManager | None" = None
    
    def __init__(self, config: WarmPoolConfig | None = None):
        self.config = config or WarmPoolConfig()
        self._pool: dict[str, WarmRuntime] = {}  # pool_id -> WarmRuntime
        self._lock = asyncio.Lock()
        self._replenish_task: asyncio.Task | None = None
        self._cleanup_task: asyncio.Task | None = None
        self._initialized = False
        
        # 统计信息
        self._total_acquisitions = 0
        self._successful_acquisitions = 0
        self._fallback_acquisitions = 0
        self._total_init_time_ms = 0
        self._init_count = 0
        
        # 外部依赖（延迟注入）
        self._conversation_manager = None
        self._file_store = None
        self._sio = None
        self._server_config = None
    
    @classmethod
    def get_instance(cls, config: WarmPoolConfig | None = None) -> "WarmPoolManager":
        """获取单例实例"""
        if cls._instance is None:
            cls._instance = cls(config)
        return cls._instance
    
    def inject_dependencies(
        self,
        conversation_manager,
        file_store,
        sio,
        server_config,
    ):
        """注入外部依赖（在应用启动时调用）"""
        self._conversation_manager = conversation_manager
        self._file_store = file_store
        self._sio = sio
        self._server_config = server_config
    
    async def start(self):
        """启动预热池（开始后台任务）"""
        if not self.config.enabled:
            logger.info("Warm pool is disabled")
            return
            
        if self._initialized:
            logger.warning("Warm pool already initialized")
            return
        
        logger.info(
            f"Starting warm pool: min={self.config.min_pool_size}, "
            f"max={self.config.max_pool_size}"
        )
        
        self._initialized = True
        
        # 启动后台任务
        self._replenish_task = asyncio.create_task(self._replenish_loop())
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        # 初始预热
        await self._ensure_min_pool_size()
    
    async def stop(self):
        """停止预热池"""
        logger.info("Stopping warm pool...")
        
        if self._replenish_task:
            self._replenish_task.cancel()
            self._replenish_task = None
        
        if self._cleanup_task:
            self._cleanup_task.cancel()
            self._cleanup_task = None
        
        # 清理所有预热实例
        async with self._lock:
            for warm_runtime in list(self._pool.values()):
                await self._destroy_warm_runtime(warm_runtime)
            self._pool.clear()
        
        self._initialized = False
        logger.info("Warm pool stopped")
    
    async def acquire(
        self,
        conversation_id: str,
        user_id: str | None,
        settings: "Settings | None" = None,
    ) -> WarmRuntime | None:
        """
        获取一个预热好的 runtime
        
        Returns:
            WarmRuntime: 预热好的 runtime，如果没有可用的则返回 None
        """
        self._total_acquisitions += 1
        
        if not self.config.enabled or not self._initialized:
            self._fallback_acquisitions += 1
            return None
        
        async with self._lock:
            # 查找第一个就绪的实例
            for warm_runtime in self._pool.values():
                if warm_runtime.is_available():
                    warm_runtime.assign(conversation_id, user_id)
                    self._successful_acquisitions += 1
                    logger.info(
                        f"Acquired warm runtime {warm_runtime.pool_id} "
                        f"for conversation {conversation_id}"
                    )
                    # 触发补充
                    asyncio.create_task(self._schedule_replenish())
                    return warm_runtime
        
        # 没有可用的预热实例
        self._fallback_acquisitions += 1
        logger.info(
            f"No warm runtime available for conversation {conversation_id}, "
            "falling back to normal creation"
        )
        return None

    def get_status(self) -> WarmPoolStatus:
        """获取预热池状态"""
        instances = []
        ready_count = 0
        initializing_count = 0
        assigned_count = 0

        for wr in self._pool.values():
            if wr.state == WarmRuntimeState.READY:
                ready_count += 1
            elif wr.state == WarmRuntimeState.INITIALIZING:
                initializing_count += 1
            elif wr.state == WarmRuntimeState.ASSIGNED:
                assigned_count += 1

            instances.append({
                "pool_id": wr.pool_id,
                "state": wr.state.value,
                "created_at": wr.created_at.isoformat() if wr.created_at else None,
                "ready_at": wr.ready_at.isoformat() if wr.ready_at else None,
                "initialization_time_ms": wr.initialization_time_ms,
            })

        avg_init_time = (
            self._total_init_time_ms / self._init_count
            if self._init_count > 0 else 0.0
        )

        return WarmPoolStatus(
            enabled=self.config.enabled,
            total_instances=len(self._pool),
            ready_instances=ready_count,
            initializing_instances=initializing_count,
            assigned_instances=assigned_count,
            min_pool_size=self.config.min_pool_size,
            max_pool_size=self.config.max_pool_size,
            total_acquisitions=self._total_acquisitions,
            successful_acquisitions=self._successful_acquisitions,
            fallback_acquisitions=self._fallback_acquisitions,
            avg_initialization_time_ms=avg_init_time,
            instances=instances,
        )

    async def _ensure_min_pool_size(self):
        """确保池中至少有 min_pool_size 个就绪实例"""
        async with self._lock:
            ready_count = sum(
                1 for wr in self._pool.values()
                if wr.state in (WarmRuntimeState.READY, WarmRuntimeState.INITIALIZING)
            )

            needed = self.config.min_pool_size - ready_count
            if needed > 0:
                logger.info(f"Need to create {needed} warm runtime(s)")
                for _ in range(needed):
                    asyncio.create_task(self._create_warm_runtime())

    async def _schedule_replenish(self):
        """延迟补充池"""
        await asyncio.sleep(self.config.replenish_delay_seconds)
        await self._ensure_min_pool_size()

    async def _replenish_loop(self):
        """后台补充循环"""
        while True:
            try:
                await asyncio.sleep(30)  # 每30秒检查一次
                await self._ensure_min_pool_size()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in replenish loop: {e}")

    async def _cleanup_loop(self):
        """后台清理循环"""
        while True:
            try:
                await asyncio.sleep(60)  # 每60秒检查一次
                await self._cleanup_expired()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")

    async def _cleanup_expired(self):
        """清理过期的预热实例"""
        now = datetime.utcnow()
        to_remove = []

        async with self._lock:
            for pool_id, wr in self._pool.items():
                # 跳过已分配的
                if wr.state == WarmRuntimeState.ASSIGNED:
                    continue

                # 检查是否过期
                if wr.ready_at:
                    idle_seconds = (now - wr.ready_at).total_seconds()
                    if idle_seconds > self.config.max_idle_time_seconds:
                        to_remove.append(pool_id)
                        continue

                # 检查生命周期
                if wr.created_at:
                    lifetime = (now - wr.created_at).total_seconds()
                    if lifetime > self.config.max_lifetime_seconds:
                        to_remove.append(pool_id)

        for pool_id in to_remove:
            logger.info(f"Cleaning up expired warm runtime: {pool_id}")
            await self._remove_warm_runtime(pool_id)

    async def _create_warm_runtime(self) -> WarmRuntime | None:
        """创建一个新的预热 runtime"""
        pool_id = f"warm-{uuid.uuid4().hex[:8]}"

        warm_runtime = WarmRuntime(
            pool_id=pool_id,
            state=WarmRuntimeState.INITIALIZING,
            created_at=datetime.utcnow(),
        )

        async with self._lock:
            if len(self._pool) >= self.config.max_pool_size:
                logger.warning("Pool is at max capacity, skipping creation")
                return None
            self._pool[pool_id] = warm_runtime

        try:
            logger.info(f"Creating warm runtime: {pool_id}")
            # TODO: 实际创建 runtime 的逻辑
            # 这里需要调用 conversation_manager 的方法来创建 session
            # 但不关联到任何特定对话

            # 模拟初始化时间（实际实现时移除）
            await asyncio.sleep(2)

            warm_runtime.mark_ready()
            self._init_count += 1
            self._total_init_time_ms += warm_runtime.initialization_time_ms

            logger.info(
                f"Warm runtime ready: {pool_id} "
                f"(init time: {warm_runtime.initialization_time_ms}ms)"
            )
            return warm_runtime

        except Exception as e:
            logger.error(f"Failed to create warm runtime {pool_id}: {e}")
            warm_runtime.state = WarmRuntimeState.ERROR
            await self._remove_warm_runtime(pool_id)
            return None

    async def _remove_warm_runtime(self, pool_id: str):
        """移除并销毁预热 runtime"""
        async with self._lock:
            warm_runtime = self._pool.pop(pool_id, None)

        if warm_runtime:
            await self._destroy_warm_runtime(warm_runtime)

    async def _destroy_warm_runtime(self, warm_runtime: WarmRuntime):
        """销毁预热 runtime 释放资源"""
        logger.info(f"Destroying warm runtime: {warm_runtime.pool_id}")
        # TODO: 实际清理 runtime 资源
        # if warm_runtime.session:
        #     await warm_runtime.session.close()
        warm_runtime.state = WarmRuntimeState.EXPIRED


# 全局单例
warm_pool_manager = WarmPoolManager.get_instance()

