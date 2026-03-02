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


# ==================== 扩展端点 ====================


@base_app.get("/atoms-plus")
def atoms_plus_info():
    """Atoms Plus 信息端点"""
    return {
        "name": "Atoms Plus",
        "version": "0.2.0",
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
        ],
    }


@base_app.get("/atoms-plus/health")
def atoms_plus_health():
    """健康检查端点"""
    return {"status": "ok", "service": "atoms-plus"}


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

