"""
Warm Pool Manager - 预热池状态监控器

此模块作为 OpenHands LocalRuntime 内置 warm server 功能的状态监控层。
LocalRuntime 已经内置了预热功能，通过以下环境变量控制：
- INITIAL_NUM_WARM_SERVERS: 启动时创建的预热服务器数量
- DESIRED_NUM_WARM_SERVERS: 期望维持的预热服务器数量

本模块提供：
1. 查询 LocalRuntime 的 warm server 状态
2. 提供统一的 API 接口
3. 不实际管理 warm server 的生命周期（由 LocalRuntime 负责）
"""

import os
from typing import Any

from openhands.core.logger import openhands_logger as logger

from .models import WarmPoolConfig, WarmPoolStatus


class WarmPoolManager:
    """
    预热池状态监控器

    这是一个轻量级的状态监控类，读取 LocalRuntime 的内置 warm server 状态
    """

    _instance: "WarmPoolManager | None" = None

    def __init__(self, config: WarmPoolConfig | None = None):
        self.config = config or WarmPoolConfig()
        self._initialized = False

    @classmethod
    def get_instance(cls, config: WarmPoolConfig | None = None) -> "WarmPoolManager":
        """获取单例实例"""
        if cls._instance is None:
            cls._instance = cls(config)
        return cls._instance

    async def start(self):
        """
        启动预热池监控

        注意：实际的 warm server 由 LocalRuntime 在其 setup() 方法中创建，
        此方法仅标记监控器为已初始化状态
        """
        if self._initialized:
            logger.warning("Warm pool monitor already initialized")
            return

        # 读取环境变量配置
        initial_num = os.getenv("INITIAL_NUM_WARM_SERVERS", "0")
        desired_num = os.getenv("DESIRED_NUM_WARM_SERVERS", "0")

        logger.info(
            f"Warm pool monitor starting - LocalRuntime config: "
            f"INITIAL_NUM_WARM_SERVERS={initial_num}, "
            f"DESIRED_NUM_WARM_SERVERS={desired_num}"
        )

        self._initialized = True
        logger.info("Warm pool monitor started")

    async def stop(self):
        """停止预热池监控"""
        logger.info("Warm pool monitor stopping...")
        self._initialized = False
        logger.info("Warm pool monitor stopped")

    def get_status(self) -> WarmPoolStatus:
        """
        获取预热池状态

        从 LocalRuntime 的 _WARM_SERVERS 全局变量读取状态
        """
        # 尝试读取 LocalRuntime 的内置状态
        ready_count = 0
        instances: list[dict[str, Any]] = []

        try:
            # 动态导入以避免循环依赖
            from openhands.runtime.impl.local.local_runtime import (
                _WARM_SERVERS,
                _RUNNING_SERVERS,
            )

            ready_count = len(_WARM_SERVERS)

            # 构建实例信息
            for i, server_info in enumerate(_WARM_SERVERS):
                instances.append({
                    "pool_id": f"warm-server-{i}",
                    "state": "ready",
                    "port": server_info.execution_server_port,
                    "vscode_port": server_info.vscode_port,
                })

            logger.debug(
                f"Warm pool status: {ready_count} ready servers, "
                f"{len(_RUNNING_SERVERS)} running conversations"
            )

        except ImportError:
            logger.warning("LocalRuntime not available, warm server status unavailable")
        except Exception as e:
            logger.error(f"Error reading warm server status: {e}")

        # 读取环境变量配置
        initial_num = int(os.getenv("INITIAL_NUM_WARM_SERVERS", "0"))
        desired_num = int(os.getenv("DESIRED_NUM_WARM_SERVERS", "0"))

        # 判断是否启用
        enabled = initial_num > 0 or desired_num > 0

        return WarmPoolStatus(
            enabled=enabled,
            total_instances=ready_count,
            ready_instances=ready_count,
            initializing_instances=0,  # LocalRuntime 不暴露此状态
            assigned_instances=0,  # 分配后从 _WARM_SERVERS 移除
            min_pool_size=initial_num,
            max_pool_size=desired_num,
            total_acquisitions=0,  # LocalRuntime 不暴露此统计
            successful_acquisitions=0,
            fallback_acquisitions=0,
            avg_initialization_time_ms=0.0,
            instances=instances,
        )

    def is_warm_pool_available(self) -> bool:
        """检查是否有可用的预热实例"""
        try:
            from openhands.runtime.impl.local.local_runtime import _WARM_SERVERS
            return len(_WARM_SERVERS) > 0
        except Exception:
            return False


# 全局单例
warm_pool_manager = WarmPoolManager.get_instance()

