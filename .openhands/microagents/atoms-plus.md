---
name: atoms_plus
type: repo
version: 1.0.0
agent: CodeActAgent
---

# Atoms Plus 低代码平台

Atoms Plus 是一个基于 OpenHands 的 AI 辅助开发平台，目标是复刻 atoms.dev 的功能。

## 项目架构

```
atoms-plus/
├── atoms_plus/                 # Atoms Plus 扩展模块
│   ├── atoms_server.py         # 扩展服务器入口
│   ├── scaffolding/            # 项目脚手架系统
│   │   ├── api.py              # API 路由
│   │   ├── generator.py        # 项目生成器
│   │   ├── models.py           # 数据模型
│   │   └── templates/          # 项目模板
│   ├── race_mode/              # 多模型竞速功能
│   └── roles/                  # Agent 角色系统
├── frontend/                   # OpenHands 前端
│   └── src/components/features/scaffolding/  # 脚手架 UI
├── openhands/                  # OpenHands 核心代码
└── .openhands/microagents/     # 自定义 Skills
```

## 核心功能

### 1. 项目脚手架系统

支持一键生成 React/Next.js/Vue/Nuxt 项目：

```python
from atoms_plus.scaffolding import ProjectGenerator, ProjectConfig, ProjectType

config = ProjectConfig(
    name='my-app',
    project_type=ProjectType.NEXTJS,
    features=[FeatureSet.TYPESCRIPT, FeatureSet.SUPABASE]
)
result = ProjectGenerator().generate(config)
```

### 2. Race Mode（多模型竞速）

同时调用多个 LLM 模型，选择最佳结果：
- 后端代码: `atoms_plus/race_mode/`
- 前端 UI: 待实现

### 3. Agent 角色系统

预定义的专业角色：
- Coder（代码编写）
- Designer（UI 设计）
- Planner（架构规划）

## 部署信息

| 环境 | URL | 平台 |
|------|-----|------|
| 前端 | https://frontend-ten-beta-79.vercel.app | Vercel |
| 后端 | https://openhands-production-c7c2.up.railway.app | Railway |
| 数据库 | akvsldogobzimfbtrdha.supabase.co | Supabase |

## 开发指南

### 启动后端

```bash
cd atoms-plus
uvicorn atoms_plus.atoms_server:app --host 0.0.0.0 --port 3000 --reload
```

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 运行测试

```bash
# 后端测试
poetry run pytest tests/unit/test_xxx.py

# 前端测试
cd frontend && npm run test
```

## 技术栈

- **后端**: Python 3.12+, FastAPI, Jinja2
- **前端**: React 18, TypeScript, Tailwind CSS, Vite
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel (前端), Railway (后端)
- **AI**: 阿里百炼 (qwen-plus), 可扩展支持其他 LLM

## 相关文档

- `CLAUDE.md` - 部署配置详情
- `AGENTS.md` - OpenHands 开发指南
- `.openhands/microagents/` - 自定义 Skills

