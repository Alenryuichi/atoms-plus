"""
Atoms Plus Server - 基于 OpenHands 的扩展服务器

遵循 enterprise/ 目录的扩展模式：
1. 导入 OpenHands 基础应用 (base_app) 和 listen 模块的 CORS/socketio 配置
2. 注册自定义路由
3. 不修改 OpenHands 核心文件

启动方式：
    cd atoms-plus
    python -m atoms_plus.atoms_server

或者使用 uvicorn：
    uvicorn atoms_plus.atoms_server:app --reload --port 3000
"""

import os
import sys

# 确保项目根目录在 Python 路径中
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from dotenv import load_dotenv

load_dotenv()

# 导入 OpenHands 基础应用 (用于注册路由)
from openhands.server.app import app as base_app

# 导入 Atoms Plus 扩展路由
from atoms_plus.race_mode.api import router as race_router
from atoms_plus.roles.api import router as roles_router
from atoms_plus.orchestrator.api import router as orchestrator_router
from atoms_plus.scaffolding.api import router as scaffolding_router
from atoms_plus.warm_pool.api import router as warm_pool_router

# ==================== 注册扩展路由 ====================
# 注意：路由必须在导入 listen.py 之前注册，因为 listen.py 会包装 base_app

# Race Mode API - 多模型竞速对比
# 路由前缀: /api/v1/race/*
base_app.include_router(race_router, prefix="/api/v1")

# Roles API - 角色系统
# 路由前缀: /api/v1/roles/*
base_app.include_router(roles_router)

# Orchestrator API - 多角色协调
# 路由前缀: /api/v1/orchestrator/*
base_app.include_router(orchestrator_router)

# Scaffolding API - 项目脚手架
# 路由前缀: /api/v1/scaffolding/*
base_app.include_router(scaffolding_router, prefix="/api/v1")

# Warm Pool API - Runtime 预热池
# 路由前缀: /api/v1/warm-pool/*
base_app.include_router(warm_pool_router, prefix="/api/v1")


# ==================== 扩展端点 ====================


@base_app.get("/atoms-plus")
def atoms_plus_info():
    """Atoms Plus 信息端点"""
    return {
        "name": "Atoms Plus",
        "version": "0.4.0",
        "description": "OpenHands 扩展层 - 复刻 Atoms.dev 功能",
        "features": [
            {
                "name": "Race Mode",
                "path": "/api/v1/race",
                "description": "多模型并行竞速对比",
            },
            {
                "name": "Agent Roles",
                "path": "/api/v1/roles",
                "description": "8种专业角色切换",
            },
            {
                "name": "Orchestrator",
                "path": "/api/v1/orchestrator",
                "description": "多角色并行协调",
            },
            {
                "name": "Scaffolding",
                "path": "/api/v1/scaffolding",
                "description": "项目脚手架生成 (React/Next.js/Vue/Nuxt)",
            },
            {
                "name": "Warm Pool",
                "path": "/api/v1/warm-pool",
                "description": "Runtime 预热池 - 消除启动等待时间",
            },
        ],
    }


@base_app.get("/atoms-plus/health")
def atoms_plus_health():
    """健康检查端点"""
    from atoms_plus.warm_pool import warm_pool_manager

    pool_status = warm_pool_manager.get_status()
    return {
        "status": "ok",
        "service": "atoms-plus",
        "warm_pool": {
            "enabled": pool_status.enabled,
            "ready_instances": pool_status.ready_instances,
            "total_instances": pool_status.total_instances,
        },
    }


# ==================== 启动钩子 ====================

@base_app.on_event("startup")
async def startup_warm_pool():
    """
    应用启动时初始化 warm pool 监控

    注意：实际的 warm server 由 LocalRuntime 在 setup() 中创建，
    通过环境变量控制：
    - INITIAL_NUM_WARM_SERVERS: 启动时创建的预热服务器数量
    - DESIRED_NUM_WARM_SERVERS: 期望维持的预热服务器数量
    """
    from atoms_plus.warm_pool import warm_pool_manager

    initial = os.getenv("INITIAL_NUM_WARM_SERVERS", "0")
    desired = os.getenv("DESIRED_NUM_WARM_SERVERS", "0")

    print(f"🔥 Warm Pool Config: INITIAL={initial}, DESIRED={desired}")
    print("   (Managed by LocalRuntime - see openhands/runtime/impl/local/)")

    await warm_pool_manager.start()
    print("✅ Warm Pool monitor started")


@base_app.on_event("shutdown")
async def shutdown_warm_pool():
    """应用关闭时停止 warm pool 监控"""
    from atoms_plus.warm_pool import warm_pool_manager

    print("🛑 Stopping Warm Pool monitor...")
    await warm_pool_manager.stop()
    print("✅ Warm Pool monitor stopped")


# ==================== 应用导出 ====================

# 导入 listen.py 中完整配置的 app (包含 CORS middleware + socketio)
# 这样所有请求都会经过正确的 middleware 链
from openhands.server.listen import app  # noqa: E402

# ==================== 直接运行 ====================

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 3000))
    host = os.environ.get("HOST", "0.0.0.0")

    print(f"🚀 Starting Atoms Plus Server on {host}:{port}")
    print("📚 API Docs: http://localhost:{port}/docs")
    print("🏎️ Race Mode: http://localhost:{port}/api/v1/race/models")

    uvicorn.run(
        "atoms_plus.atoms_server:app",
        host=host,
        port=port,
        reload=True,
    )

