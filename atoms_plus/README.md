# Atoms Plus - OpenHands 扩展层

基于 OpenHands 的 Atoms.dev 功能复刻，遵循 **enterprise 扩展模式**。

## ✅ 最佳实践

| 原则 | 实现 |
|------|------|
| **不修改 OpenHands 核心** | ✅ 所有扩展代码在 `atoms_plus/` 目录 |
| **遵循 enterprise 模式** | ✅ 通过 `atoms_server.py` 导入 `base_app` 并注册路由 |
| **前端独立** | ✅ 前端组件在 `atoms_plus/frontend/`，不影响核心 |
| **上游更新兼容** | ✅ 可以安全地 `git pull upstream main` |

## 📁 目录结构

```
atoms_plus/
├── README.md                    # 本文件
├── __init__.py                  # 模块入口
├── atoms_server.py              # ⭐ 主服务器入口
├── race_mode/                   # Race Mode 功能
│   ├── __init__.py
│   ├── coordinator.py           # LiteLLM 多模型协调器
│   ├── result_selector.py       # 结果选择器
│   └── api.py                   # FastAPI 路由
└── frontend/                    # 前端扩展（独立）
    ├── README.md                # 前端集成指南
    ├── index.ts                 # 导出入口
    ├── api/
    │   └── race-service.ts      # API 客户端
    └── components/
        └── RaceMode.tsx         # React 组件
```

## 🚀 快速开始

### 启动服务器

```bash
cd atoms-plus

# 方法 1: 直接运行
python -m atoms_plus.atoms_server

# 方法 2: 使用 uvicorn
uvicorn atoms_plus.atoms_server:app --reload --port 3000
```

### 环境变量

```bash
# 设置 LLM API 密钥
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="..."
```

### API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/atoms-plus` | GET | 扩展信息 |
| `/atoms-plus/health` | GET | 健康检查 |
| `/api/v1/race/start` | POST | 启动竞速 |
| `/api/v1/race/select-best` | POST | 选择最佳结果 |
| `/api/v1/race/models` | GET | 支持的模型列表 |
| `/api/v1/race/session/{id}` | GET | 会话详情 |

## 🏎️ Race Mode 使用示例

### Python

```python
import asyncio
from atoms_plus.race_mode import RaceCoordinator, ResultSelector, SelectionCriteria

async def main():
    # 初始化协调器
    race = RaceCoordinator(
        models=["claude-sonnet-4-20250514", "gpt-4o", "gemini/gemini-2.0-flash"],
        timeout=60.0,
    )
    
    # 并行调用所有模型
    results = await race.run("用 Python 实现快速排序算法")
    
    # 选择最佳结果
    selector = ResultSelector(criteria=SelectionCriteria.BALANCED)
    best = selector.select_best(results)
    
    print(f"🏆 Winner: {best.model_name}")
    print(f"⏱️ Time: {best.execution_time:.2f}s")
    print(f"💰 Cost: ${best.cost_estimate:.4f}")

asyncio.run(main())
```

### cURL

```bash
# 启动竞速
curl -X POST http://localhost:3000/api/v1/race/start \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, write a simple Python function"}'

# 获取模型列表
curl http://localhost:3000/api/v1/race/models
```

## 🔗 前端集成

详见 [frontend/README.md](./frontend/README.md)

## 📝 与 Enterprise 模式对比

```python
# enterprise/saas_server.py 模式
from openhands.server.app import app as base_app
base_app.include_router(billing_router)

# atoms_plus/atoms_server.py 模式（相同！）
from openhands.server.app import app as base_app
base_app.include_router(race_router, prefix="/api/v1")
```

## 📜 License

继承 OpenHands MIT 许可证

