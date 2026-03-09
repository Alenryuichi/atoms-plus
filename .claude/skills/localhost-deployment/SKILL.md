---
name: atoms-plus-localhost-deployment
description: Complete guide for deploying Atoms Plus (OpenHands fork) locally. Use when setting up local development environment, debugging WebSocket connections, or troubleshooting sandbox issues.
---

# Atoms Plus 本地部署指南

**Version**: 0.3.0
**Runtime**: `RUNTIME=local` (ProcessSandboxService)

## 安装 CLI 工具

```bash
# 安装 atoms-plus-cli 到项目环境
poetry run pip install -e atoms_plus/

# 验证安装
poetry run atoms --help
```

安装后，AI Agent (Claude Code, Gemini CLI 等) 可以直接调用 `atoms` 命令。

## 架构概览

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   App Server    │────▶│  Agent Server   │
│   (Vite)        │     │   (FastAPI)     │     │  (Subprocess)   │
│   :3002         │     │   :3000         │     │  :8000+         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │   LLM API       │
                        │   (Remote)      │
                        └─────────────────┘
```

## 快速启动 (推荐)

### 一键部署

```bash
# 启动后端 + 前端
poetry run atoms start

# 访问地址
#   前端: http://localhost:3002
#   后端: http://localhost:3000/atoms-plus
```

### CLI 命令参考

| 命令 | 说明 |
|------|------|
| `atoms start` | 启动后端和前端服务 |
| `atoms start -b` | 仅启动后端 |
| `atoms start -f` | 仅启动前端 |
| `atoms stop` | 停止所有服务 |
| `atoms stop -b` | 仅停止后端 |
| `atoms stop -f` | 仅停止前端 |
| `atoms restart` | 重启所有服务 |
| `atoms status` | 检查部署状态 (默认) |
| `atoms logs` | 查看服务日志 |
| `atoms test` | 运行 E2E 测试 |

```bash
# 检查状态 (默认命令，会检测 CLI 安装)
poetry run atoms status
poetry run atoms

# 独立启动/停止服务
poetry run atoms start --backend-only   # 仅启动后端
poetry run atoms start --frontend-only  # 仅启动前端
poetry run atoms stop -b                # 仅停止后端
poetry run atoms stop -f                # 仅停止前端

# 查看日志
poetry run atoms logs
poetry run atoms logs --service backend -f

# 停止服务
poetry run atoms stop

# 重启服务
poetry run atoms restart

# E2E 测试
poetry run atoms test --task "Create a todo app"
```

### 日志文件位置

```
/tmp/atoms-plus-logs/
├── backend.log   # 后端日志
└── frontend.log  # 前端日志
```

---

## 手动启动 (高级)

### 1. 启动后端 (App Server)

```bash
export RUNTIME=local
export SKIP_DEPENDENCY_CHECK=1
export OH_DISABLE_MCP=true

poetry run python -m atoms_plus.atoms_server
```

### 2. 启动前端

```bash
cd frontend
VITE_FRONTEND_PORT=3002 npm run dev
```

### 3. 验证服务

```bash
# 后端健康检查
curl http://localhost:3000/atoms-plus/health

# Agent Server 存活检查
curl http://localhost:8000/alive
```

## 关键配置

### 前端环境变量 (`frontend/.env.local`)

```bash
# 必需：指向本地 App Server
VITE_BACKEND_BASE_URL=localhost:3000

# 可选：禁用 TLS（本地开发）
VITE_USE_TLS=false
```

### 后端环境变量

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `RUNTIME` | ✅ | - | 设为 `local` 使用 ProcessSandboxService |
| `LLM_API_KEY` | ✅ | - | LLM API 密钥 |
| `LLM_BASE_URL` | ✅ | - | LLM API 地址 |
| `LLM_MODEL` | ✅ | - | 模型名称 (需 `openai/` 前缀) |
| `OH_DISABLE_MCP` | ❌ | `false` | 禁用 MCP 服务器 |
| `SKIP_DEPENDENCY_CHECK` | ❌ | `false` | 跳过依赖检查 |

### 用户设置 (`~/.openhands/settings.json`)

```json
{
  "llm_model": "openai/MiniMax-M2.5",
  "llm_api_key": "sk-xxx",
  "llm_base_url": "https://coding.dashscope.aliyuncs.com/v1",
  "v1_enabled": true
}
```

## 常见问题排查

### 问题 1: "正在连接..." 卡住

**原因**: 前端未正确配置 `VITE_BACKEND_BASE_URL`

**解决**:
```bash
echo 'VITE_BACKEND_BASE_URL=localhost:3000' > frontend/.env.local
cd frontend && npm run dev
```

### 问题 2: "已断开连接" 错误

**原因**: 
1. 系统代理干扰 WebSocket 连接
2. 旧对话的 Agent Server 不存在

**解决**:
```bash
# 1. 检查代理
echo $ALL_PROXY $HTTP_PROXY $HTTPS_PROXY

# 2. 安装 python-socks（如果有代理）
poetry add python-socks

# 3. 重启后端
NO_PROXY=localhost,127.0.0.1 poetry run python -m atoms_plus.atoms_server

# 4. 清除浏览器缓存，创建新对话
```

### 问题 3: WebSocket 502 Bad Gateway

**原因**: Agent Server 端口不匹配

**诊断**:
```bash
# 检查正在运行的 Agent Server
ps aux | grep "openhands.agent_server"
lsof -i :8000
lsof -i :8001

# 检查对话状态
curl -s http://localhost:3000/api/v1/app-conversations/search?limit=3 | jq '.items[] | {id, sandbox_status, conversation_url}'
```

### 问题 4: LLM API 错误

**诊断**:
```bash
# 测试 API 连接
curl -s https://coding.dashscope.aliyuncs.com/v1/chat/completions \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "MiniMax-M2.5", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 10}'
```

## 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 3002 | Vite Dev Server | 前端 |
| 3000 | App Server | FastAPI 后端 |
| 8000+ | Agent Server | 每个沙盒一个端口 |

## 相关文件

- `atoms_plus/team_mode/e2e_test.py` - **CLI 工具入口 (推荐)**
- `atoms_plus/atoms_server.py` - 扩展服务器入口
- `openhands/app_server/sandbox/process_sandbox_service.py` - 本地沙盒服务
- `openhands/app_server/runtime_proxy/runtime_proxy_router.py` - WebSocket 代理
- `frontend/.env.local` - 前端本地配置
- `~/.openhands/settings.json` - 用户 LLM 配置

