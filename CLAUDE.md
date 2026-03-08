# Atoms Plus 部署配置

## 项目概述

基于 OpenHands 的扩展项目，目标是复刻 [atoms.dev](https://atoms.dev) 的功能。

**当前版本**: `0.3.0`

## 当前部署状态

### 服务状态 ✅

| 服务 | 状态 | URL |
|------|------|-----|
| **前端** | ✅ 运行中 | https://frontend-ten-beta-79.vercel.app |
| **后端** | ✅ 运行中 | https://openhands-production-c7c2.up.railway.app |
| **数据库** | ✅ 运行中 | https://akvsldogobzimfbtrdha.supabase.co |

### 前端 (Vercel)

| 配置项 | 值 |
|--------|-----|
| **生产 URL** | https://frontend-ten-beta-79.vercel.app |
| **Team ID** | `team_JGQnbcn6GpLRZUpWN9XAeUU3` |
| **Project ID** | `prj_ZKTfHFE7EHNcINQZEQ3eubppGalU` |

#### 环境变量

```
VITE_BACKEND_BASE_URL=openhands-production-c7c2.up.railway.app
VITE_USE_TLS=true
VITE_SUPABASE_URL=https://akvsldogobzimfbtrdha.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 后端 (Railway)

| 配置项 | 值 |
|--------|-----|
| **生产 URL** | https://openhands-production-c7c2.up.railway.app |
| **入口文件** | `atoms_plus/atoms_server.py` |
| **Project ID** | `fda5e595-b22b-40b2-a104-3245a818db08` |
| **Service ID** | `f35c7cf5-4f07-4c97-b3de-87630e07562c` |
| **Plan** | Trial (30 days or $5.00) |

#### 环境变量

```
LLM_API_KEY=sk-1d30db2d6c864ad5b12065aaf30a0efc
LLM_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
LLM_MODEL=openai/MiniMax-M2.5
LLM_MAX_OUTPUT_TOKENS=4096
LLM_TIMEOUT=180
OH_SECRET_KEY=szqgnj7u5pf9bhvynuq67183m2la55yw
SANDBOX_API_KEY=sk-oh-etrszt3bL2TQm5DrG9yP61FB7XkoDIO0
PERMITTED_CORS_ORIGINS=https://frontend-ten-beta-79.vercel.app
RUNTIME=local
OH_ENABLE_BROWSER=false
OH_PERSISTENCE_DIR=/.openhands
OH_DISABLE_MCP=true
WEB_HOST=0.0.0.0
```

#### 阿里百炼 Coding API 可用模型

> **重要**: 所有模型在 LiteLLM 中需要加 `openai/` 前缀，因为 API 兼容 OpenAI 协议

| 模型 | LiteLLM 格式 | 图片理解 |
|------|-------------|---------|
| qwen3.5-plus | `openai/qwen3.5-plus` | ✅ |
| kimi-k2.5 | `openai/kimi-k2.5` | ✅ |
| glm-5 | `openai/glm-5` | ❌ |
| MiniMax-M2.5 | `openai/MiniMax-M2.5` | ❌ |
| qwen3-max-2026-01-23 | `openai/qwen3-max-2026-01-23` | ❌ |
| qwen3-coder-next | `openai/qwen3-coder-next` | ❌ |
| qwen3-coder-plus | `openai/qwen3-coder-plus` | ❌ |
| glm-4.7 | `openai/glm-4.7` | ❌ |

### 数据库 (Supabase)

| 配置项 | 值 |
|--------|-----|
| **Project ID** | `akvsldogobzimfbtrdha` |
| **Region** | `ap-south-1` |
| **URL** | https://akvsldogobzimfbtrdha.supabase.co |

## 部署命令

### 前端部署 (Vercel)

```bash
cd frontend
npm run lint:fix && npm run build
npx vercel deploy --prod --yes
```

### 后端部署 (Railway)

当前使用 Railway 的 GitHub 集成自动部署。推送到 `main` 分支后自动触发。

## ⚠️ V0 vs V1 架构 (重要)

**V1 是当前使用的架构，V0 是遗留代码 (计划 2026-04-01 删除)**

| 组件 | V0 (不要修改) | V1 (修改这里) |
|------|--------------|--------------|
| 对话管理 | `openhands/server/` | `openhands/app_server/` |
| Runtime | `LocalRuntime` | `ProcessSandboxService` / `DaytonaSandboxService` |
| 工作目录 | `/workspace` | `/tmp/openhands-sandboxes/{id}` 或 Daytona 云端 |
| Git 初始化 | `runtime/base.py` | `sandbox/process_sandbox_service.py` |

**关键：`RUNTIME=local` 时，V1 使用 `ProcessSandboxService`，不是 `LocalRuntime`！**

## 🚀 Daytona 云沙盒集成

当 `RUNTIME=daytona` 时，使用 Daytona 云沙盒服务，提供完全隔离的云端开发环境。

### 环境变量配置

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `RUNTIME` | ✅ | - | 设置为 `daytona` |
| `DAYTONA_API_KEY` | ✅ | - | Daytona API 密钥 (从 https://app.daytona.io/settings/api-keys 获取) |
| `DAYTONA_API_URL` | ❌ | `https://app.daytona.io/api` | Daytona API URL |
| `DAYTONA_TARGET` | ❌ | `eu` | 目标区域 (`eu` 或 `us`) |

### 使用方式

```bash
# Railway 环境变量
RUNTIME=daytona
DAYTONA_API_KEY=your-api-key-here
DAYTONA_TARGET=us

# 本地开发
export RUNTIME=daytona
export DAYTONA_API_KEY=your-api-key-here
python -m atoms_plus.atoms_server
```

### 架构对比

| 特性 | ProcessSandboxService | DaytonaSandboxService |
|------|----------------------|----------------------|
| 隔离级别 | 进程隔离 | 云端 VM 隔离 |
| 安全性 | 🟡 中 | 🟢 高 |
| 工作目录 | `/tmp/openhands-sandboxes/{id}` | `/workspace/project` |
| 端口 | 动态分配 (8000+) | 固定 (4444, 4445) |
| VSCode 支持 | ❌ 禁用 | ✅ 启用 |
| 持久化 | 本地文件系统 | Daytona 云存储 |

## 项目结构

```
atoms-plus/
├── openhands/              # OpenHands 源码
├── atoms_plus/             # Atoms Plus 扩展
│   ├── atoms_server.py     # 扩展服务器入口 (Railway 运行此文件)
│   ├── race_mode/          # Race Mode - 多模型竞速
│   ├── roles/              # Auto-Role UI API (角色由 Microagents 处理)
│   ├── orchestrator/       # Orchestrator - 多角色协调
│   └── scaffolding/        # Scaffolding - 项目脚手架
├── frontend/               # OpenHands 前端 (含 Atoms Plus UI)
│   └── src/components/features/
│       ├── auto-role/      # 自动角色指示器
│       └── scaffolding/    # 项目脚手架卡片
├── .openhands/microagents/ # 15 个 Microagents (8 角色 + 7 领域)
└── CLAUDE.md               # 本文件
```

## API 端点

### Atoms Plus 扩展 API ✅ 已启用

| 端点 | 方法 | 状态 | 说明 |
|------|------|------|------|
| `/atoms-plus` | GET | ✅ | 版本信息 (v0.3.0) |
| `/atoms-plus/health` | GET | ✅ | 健康检查 |
| `/api/v1/scaffolding/templates` | GET | ✅ | 获取 4 个项目模板 |
| `/api/v1/scaffolding/generate` | POST | ✅ | 生成项目 |
| `/api/v1/roles/auto-detect` | POST | ✅ | 自动角色检测 |
| `/api/v1/roles/list` | GET | ✅ | 获取所有角色 |
| `/api/v1/race/models` | GET | ✅ | 17 个可用模型 |
| `/api/v1/race/start` | POST | ✅ | 启动竞速 |
| `/api/v1/orchestrator/` | GET | ✅ | 协调器信息 |
| `/api/v1/orchestrator/dispatch` | POST | ✅ | 分发任务 |

### OpenHands 原生 API

- `GET /api/v1/web-client/config` - 获取配置
- `POST /api/v1/conversations` - 创建对话
- `WS /ws` - WebSocket 连接

## 已完成功能

### ✅ 项目脚手架 (Scaffolding)

支持 4 种框架的项目生成：
- React + Vite + TypeScript + Tailwind
- Next.js 14 App Router
- Vue 3 + Vite + TypeScript
- Nuxt 3

### ✅ 自动角色路由 (Auto-Role via Microagents)

**架构**: 角色由 OpenHands Microagents 处理，Auto-Role API 仅用于 UI 显示。

角色 Microagents 位于 `.openhands/microagents/role-*.md`：
- 🏗️ `role-architect.md` - Alex (Software Architect)
- 💻 `role-engineer.md` - Bob (Senior Engineer) [默认]
- 📋 `role-product-manager.md` - Emma (Product Manager)
- 📈 `role-data-analyst.md` - Diana (Data Analyst)
- 🔬 `role-researcher.md` - Ryan (Deep Researcher)
- 📊 `role-project-manager.md` - Sarah (Project Manager)
- 🔍 `role-seo-specialist.md` - Sophie (SEO Specialist)
- 👔 `role-team-leader.md` - Mike (Team Leader)

**工作原理**:
1. 用户输入触发 Microagent 的 `triggers` 关键词
2. OpenHands 自动注入角色 prompt 到 Agent 上下文
3. `/api/v1/roles/auto-detect` 读取相同的 triggers，用于 UI 显示

### ✅ Race Mode 后端

支持 17 个模型的并行竞速：
- 阿里百炼: qwen-plus, qwen-max, qwen-turbo
- DeepSeek: deepseek-chat, deepseek-coder
- 智谱: glm-4-plus, glm-4-flash, glm-4
- Anthropic: claude-sonnet-4, claude-opus-4, claude-3.5-sonnet
- OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo
- Google: gemini-2.0-flash, gemini-1.5-pro
- Mistral: mistral-large-latest

### ✅ Orchestrator 后端

多角色协调引擎，支持：
- 8 个专业角色的任务分发
- 并行/串行执行模式
- LiteLLM 多模型支持 (Qwen, DeepSeek)
- 任务建议和自动角色匹配

### ✅ Microagents

15 个 Microagents (8 角色 + 7 领域)：

**角色 Microagents** (`type: knowledge` with triggers):
- `role-architect.md`, `role-engineer.md`, `role-product-manager.md`
- `role-data-analyst.md`, `role-researcher.md`, `role-project-manager.md`
- `role-seo-specialist.md`, `role-team-leader.md`

**领域 Microagents**:
- `atoms-plus.md` - 平台知识库 (type: repo, 始终加载)
- `scaffolding.md` - 项目脚手架指南
- `component-generator.md` - React/Vue 组件生成
- `api-generator.md` - API 端点生成
- `supabase-integration.md` - Supabase 集成模式
- `deployment.md` - Vercel/Railway 部署指南
- `ui-library.md` - Radix UI/Tailwind 最佳实践

## 待实现功能

### 🔴 高优先级

| 功能 | 描述 | 状态 |
|------|------|------|
| **Race Mode UI** | 多模型竞速的前端界面 | 后端 ✅ / 前端 ❌ |
| **Orchestrator UI** | 多角色协调的前端界面 | 后端 ✅ / 前端 ❌ |

### 🟡 中优先级

| 功能 | 描述 |
|------|------|
| **Scaffolding 预览** | 生成项目后预览文件结构 |
| **一键部署** | 生成的项目直接部署到 Vercel/Railway |
| **MCP 集成** | 启用文件系统/Git/Fetch MCP 服务器 |

### 🟢 低优先级

| 功能 | 描述 |
|------|------|
| **单元测试** | 为新功能编写 pytest/vitest 测试 |
| **文档完善** | 更新 README 和 API 文档 |

## 注意事项

1. **CORS**: 必须在 Railway 设置 `PERMITTED_CORS_ORIGINS` 环境变量
2. **LLM API**: 当前使用阿里百炼 (qwen-plus)
3. **Runtime**: 设置为 `local` 以避免需要 Docker-in-Docker
4. **SPA 路由**: 某些 API 路径 (如 `/api/v1/roles`) 需要使用正确的子路径 (如 `/auto-detect`) 避免被前端 SPA fallback 拦截

