# OpenHands Agent Server API Reference

**Version**: 0.1.0  
**Package**: `openhands-agent-server` (pip)  
**Description**: REST/WebSocket interface for OpenHands AI Agent

## 认证

- **Type**: API Key (Header)
- **Header Name**: `X-Session-API-Key`
- **Required**: 大部分端点需要认证

## Base URL

在 V1 架构中，Agent Server 运行在 sandbox 子进程中，通过 runtime proxy 访问：

```
https://{backend-host}/runtime/{port}/api/...
```

例如：`https://openhands-production-c7c2.up.railway.app/runtime/8000/api/...`

---

## API 端点列表

### 🔧 Server Details

| Method | Path | Summary |
|--------|------|---------|
| GET | `/alive` | 基础存活检查 |
| GET | `/health` | 健康检查 |
| GET | `/ready` | 就绪检查 (Kubernetes probe) |
| GET | `/server_info` | 获取服务器信息 |

### 💬 Conversations

| Method | Path | Summary |
|--------|------|---------|
| GET | `/api/conversations/search` | 搜索对话 |
| GET | `/api/conversations/count` | 统计对话数量 |
| GET | `/api/conversations/{conversation_id}` | 获取对话详情 |
| PATCH | `/api/conversations/{conversation_id}` | 更新对话 |
| DELETE | `/api/conversations/{conversation_id}` | 删除对话 |
| POST | `/api/conversations/{conversation_id}/run` | 运行对话 |
| POST | `/api/conversations/{conversation_id}/pause` | 暂停对话 |
| POST | `/api/conversations/{conversation_id}/ask_agent` | 询问 Agent |
| POST | `/api/conversations/{conversation_id}/condense` | 压缩对话 |
| POST | `/api/conversations/{conversation_id}/generate_title` | 生成标题 |
| POST | `/api/conversations/{conversation_id}/secrets` | 更新密钥 |
| POST | `/api/conversations/{conversation_id}/confirmation_policy` | 设置确认策略 |
| POST | `/api/conversations/{conversation_id}/security_analyzer` | 设置安全分析器 |

### 📝 Events

| Method | Path | Summary |
|--------|------|---------|
| GET | `/api/conversations/{conversation_id}/events/search` | 搜索事件 |
| GET | `/api/conversations/{conversation_id}/events/count` | 统计事件数量 |
| GET | `/api/conversations/{conversation_id}/events/{event_id}` | 获取事件详情 |
| GET | `/api/conversations/{conversation_id}/events` | 批量获取事件 |
| POST | `/api/conversations/{conversation_id}/events` | **发送消息** |
| POST | `/api/conversations/{conversation_id}/events/respond_to_confirmation` | 响应确认 |

### 🖥️ Bash 执行

| Method | Path | Summary |
|--------|------|---------|
| POST | `/api/bash/execute_bash_command` | **执行 Bash 命令 (同步)** |
| POST | `/api/bash/start_bash_command` | 启动 Bash 命令 (异步) |
| GET | `/api/bash/bash_events/search` | 搜索 Bash 事件 |
| GET | `/api/bash/bash_events/{event_id}` | 获取 Bash 事件 |
| DELETE | `/api/bash/bash_events` | 清除所有 Bash 事件 |

#### ExecuteBashRequest Schema

```json
{
  "command": "string (required)",
  "cwd": "string | null",
  "timeout": 300
}
```

### 📂 Git 操作

| Method | Path | Summary |
|--------|------|---------|
| GET | `/api/git/changes/{path}` | **获取 Git 变更** |
| GET | `/api/git/diff/{path}` | **获取 Git Diff** |

#### GitChange Response Schema

```json
{
  "status": "MOVED" | "ADDED" | "DELETED" | "UPDATED",
  "path": "string"
}
```

#### GitDiff Response Schema

```json
{
  "modified": "string | null",
  "original": "string | null"
}
```

### 📁 File 操作

| Method | Path | Summary |
|--------|------|---------|
| GET | `/api/file/download/{path}` | 下载文件 |
| POST | `/api/file/upload/{path}` | 上传文件 |
| GET | `/api/file/download-trajectory/{conversation_id}` | 下载轨迹 |

### 🛠️ Tools & Skills

| Method | Path | Summary |
|--------|------|---------|
| GET | `/api/tools/` | 列出可用工具 |
| POST | `/api/skills` | 获取 Skills |
| POST | `/api/skills/sync` | 同步 Skills |
| POST | `/api/hooks` | 获取 Hooks |

### 💻 VSCode & Desktop

| Method | Path | Summary |
|--------|------|---------|
| GET | `/api/vscode/url` | 获取 VSCode URL |
| GET | `/api/vscode/status` | 获取 VSCode 状态 |
| GET | `/api/desktop/url` | 获取 Desktop (noVNC) URL |

---

## 使用示例

### 1. 执行 Bash 命令

```bash
curl -X POST "https://{host}/runtime/8000/api/bash/execute_bash_command" \
  -H "Content-Type: application/json" \
  -H "X-Session-API-Key: {api_key}" \
  -d '{"command": "pwd", "timeout": 30}'
```

### 2. 获取 Git 变更

```bash
curl "https://{host}/runtime/8000/api/git/changes/." \
  -H "X-Session-API-Key: {api_key}"
```

### 3. 获取 Git Diff

```bash
curl "https://{host}/runtime/8000/api/git/diff/src/main.py" \
  -H "X-Session-API-Key: {api_key}"
```

### 4. 发送消息到对话

```bash
curl -X POST "https://{host}/runtime/8000/api/conversations/{conv_id}/events" \
  -H "Content-Type: application/json" \
  -H "X-Session-API-Key: {api_key}" \
  -d '{"message": "Hello, agent!"}'
```

---

## 重要说明

1. **V1 架构**: Agent Server 是独立的 pip 包，运行在 sandbox 子进程中
2. **端口**: 默认端口 8000，通过 runtime proxy 访问
3. **认证**: 需要 `X-Session-API-Key` header
4. **Git API**: 路径参数是相对于 workspace 的路径，`.` 表示根目录

## 相关文件

- `openhands/app_server/runtime_proxy/runtime_proxy_router.py` - Runtime 代理路由
- `openhands/app_server/sandbox/process_sandbox_service.py` - Sandbox 服务

