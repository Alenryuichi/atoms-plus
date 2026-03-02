# Atoms Plus 部署配置

## 项目概述

基于 OpenHands 的扩展项目，目标是复刻 [atoms.dev](https://atoms.dev) 的功能。

## 当前部署状态

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
| **Project ID** | `fda5e595-b22b-40b2-a104-3245a818db08` |
| **Service ID** | `f35c7cf5-4f07-4c97-b3de-87630e07562c` |
| **Plan** | Trial (30 days or $5.00) |

#### 环境变量

```
LLM_API_KEY=sk-1d30db2d6c864ad5b12065aaf30a0efc
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus
PERMITTED_CORS_ORIGINS=https://frontend-ten-beta-79.vercel.app
RUNTIME=local
OH_ENABLE_BROWSER=false
OH_PERSISTENCE_DIR=/data
WEB_HOST=0.0.0.0
```

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

当前使用 Railway 的 GitHub 集成自动部署。

## 项目结构

```
atoms-plus/
├── openhands/              # OpenHands 源码
├── atoms_plus/             # Atoms Plus 扩展
│   ├── atoms_server.py     # 扩展服务器入口
│   ├── race_mode/          # Race Mode 功能
│   │   ├── api.py          # API 路由
│   │   ├── coordinator.py  # 多模型协调器
│   │   └── result_selector.py
│   └── frontend/           # 前端组件
├── frontend/               # OpenHands 前端
└── CLAUDE.md               # 本文件
```

## 待实现功能

### Race Mode (多模型竞速)

后端代码已完成 (`atoms_plus/race_mode/`)，但需要：

1. **修改 Railway 启动命令**：
   ```
   uvicorn atoms_plus.atoms_server:app --host 0.0.0.0 --port $PORT
   ```

2. **添加前端 UI 组件**：
   - Race Mode 开关
   - 多模型选择器
   - 结果对比展示

### Agent 角色切换

类似 atoms.dev 的角色系统：
- Coder (代码编写)
- Designer (UI 设计)
- Planner (架构规划)

## API 端点

### OpenHands 原生 API

- `GET /api/v1/web-client/config` - 获取配置
- `POST /api/v1/conversations` - 创建对话
- `WS /ws` - WebSocket 连接

### Atoms Plus 扩展 API (待启用)

- `GET /atoms-plus` - 扩展信息
- `GET /atoms-plus/health` - 健康检查
- `GET /api/v1/race/models` - 可用模型列表
- `POST /api/v1/race/start` - 启动竞速

## 注意事项

1. **CORS**: 必须在 Railway 设置 `PERMITTED_CORS_ORIGINS` 环境变量
2. **LLM API**: 当前使用阿里百炼 (qwen-plus)
3. **Runtime**: 设置为 `local` 以避免需要 Docker-in-Docker

