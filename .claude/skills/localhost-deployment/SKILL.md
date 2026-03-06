---
name: atoms-plus-localhost-deployment
description: Complete guide for deploying Atoms Plus (OpenHands fork) locally. Use when setting up local development environment, debugging WebSocket connections, or troubleshooting sandbox issues.
---

# Atoms Plus 本地部署指南

**Version**: 0.3.0  
**Runtime**: `RUNTIME=local` (ProcessSandboxService)

## 架构概览

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   App Server    │────▶│  Agent Server   │
│   (Vite)        │     │   (FastAPI)     │     │  (Subprocess)   │
│   :3001         │     │   :3000         │     │  :8000+         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │   LLM API       │
                        │   (Remote)      │
                        └─────────────────┘
```

## 快速启动

### 1. 启动后端 (App Server)

```bash
export RUNTIME=local
export SKIP_DEPENDENCY_CHECK=1
export LLM_API_KEY="your-api-key"
export LLM_BASE_URL="https://coding.dashscope.aliyuncs.com/v1"
export LLM_MODEL="openai/MiniMax-M2.5"
export OH_DISABLE_MCP=true

poetry run python -m atoms_plus.atoms_server
# 或
poetry run python -m openhands.app_server
```

### 2. 启动前端

```bash
cd frontend
echo 'VITE_BACKEND_BASE_URL=localhost:3000' > .env.local
npm run dev
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
| 3001 | Vite Dev Server | 前端 |
| 3000 | App Server | FastAPI 后端 |
| 8000+ | Agent Server | 每个沙盒一个端口 |

## 架构验证

### 检查 V1 进程状态

```bash
# 检查 Agent Server 进程
ps aux | grep "openhands.agent_server" | grep -v grep

# 检查动态端口
lsof -i :8000-8100 | grep python

# 检查沙盒目录
ls -la /tmp/openhands-sandboxes/

# 检查对话状态
curl -s http://localhost:3000/api/v1/app-conversations/search?limit=3 | jq '.items[] | {id, sandbox_status}'
```

### 确认 V1 架构正在使用

如果看到以下特征，说明 V1 正在工作：

| 特征 | 检查方法 | 预期结果 |
|------|----------|----------|
| 独立进程 | `ps aux \| grep agent_server` | 多个 `openhands.agent_server` 进程 |
| 动态端口 | `lsof -i :8000-8100` | 端口 800x 被 Python 占用 |
| 沙盒目录 | `ls /tmp/openhands-sandboxes/` | 存在 `{sandbox_id}/` 子目录 |

### 架构最佳实践

- **1 会话 = 1 Sandbox**: 保持状态一致性
- **Team Mode 复用 Sandbox**: 避免创建独立沙盒导致文件同步问题
- **端口范围**: Agent Server 从 8000 开始动态分配 (base_port + offset)

## 相关文件

- `atoms_plus/atoms_server.py` - 扩展服务器入口
- `openhands/app_server/sandbox/process_sandbox_service.py` - 本地沙盒服务
- `openhands/app_server/runtime_proxy/runtime_proxy_router.py` - WebSocket 代理
- `frontend/.env.local` - 前端本地配置
- `~/.openhands/settings.json` - 用户 LLM 配置

