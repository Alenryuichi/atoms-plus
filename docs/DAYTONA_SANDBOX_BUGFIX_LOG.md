# Daytona Sandbox Bugfix 日志

> 记录 2026-03-05 调试 Daytona sandbox 集成时遇到的所有问题和解决方案

## 背景

我们尝试将 OpenHands 的 sandbox 从 `ProcessSandboxService` 迁移到 Daytona 远程沙箱，以获得更好的隔离性和可扩展性。

**目标**：前端创建会话 → 后端创建 Daytona sandbox → Agent server 启动 → 用户可以正常聊天

---

## 问题 1: 307 Redirect (Auth0 认证)

### 症状
```
Agent server alive check returned 307 for sandbox xxx
```

健康检查请求被重定向到 Auth0 登录页面。

### 原因
Daytona 的 preview URL (如 `https://4444-xxx.daytonaproxy01.net`) 默认需要 Auth0 认证。使用 `sandbox.get_preview_link(port)` 返回的是普通 URL，没有认证 token。

### 解决方案
使用 `sandbox.create_signed_preview_url(port)` 获取带有嵌入式认证 token 的 URL：

```python
# ❌ 错误方式
link = sandbox.get_preview_link(port)  # 返回需要 Auth0 的 URL

# ✅ 正确方式
signed = sandbox.create_signed_preview_url(port)  # 返回带 token 的 URL
```

**文件**: `openhands/app_server/sandbox/daytona_sandbox_service.py`

---

## 问题 2: SDK 版本过旧

### 症状
```
AttributeError: 'Sandbox' object has no attribute 'create_signed_preview_url'
```

### 原因
`pyproject.toml` 中指定的 `daytona==0.24.2` 版本太旧，没有 `create_signed_preview_url` 方法。

### 解决方案
升级 SDK 版本：

```toml
# pyproject.toml
daytona = { version = ">=0.148.0", optional = true }
```

---

## 问题 3: poetry.lock 不同步

### 症状
Railway 构建失败：
```
pyproject.toml changed significantly since poetry.lock was last generated. 
Run `poetry lock` to fix the lock file.
```

### 原因
修改 `pyproject.toml` 后没有更新 `poetry.lock`。

### 解决方案
```bash
poetry lock
git add poetry.lock pyproject.toml
git commit -m "update poetry.lock"
```

**教训**: 修改 `pyproject.toml` 后必须运行 `poetry lock` 同步！

---

## 问题 4: nohup 后台执行失败

### 症状
Agent server 启动命令执行后立即退出，进程没有保持运行。

### 原因
Daytona 的 `process.exec` 使用特殊的 shell 环境，`nohup` 不能正常工作。

### 解决方案
使用简单的 `&` 后台执行：

```python
# ❌ 不工作
start_cmd = f'nohup python -m openhands.agent_server --port 4444 > /tmp/agent_server.log 2>&1 &'

# ✅ 工作
start_cmd = f'python3 -m openhands.agent_server --port 4444 > /tmp/agent_server.log 2>&1 &'
```

**原理**: Shell 执行 `&` 后快速退出，进程变成孤儿进程继续运行。

---

## 问题 5: sandbox_spec_id 硬编码 'default'

### 症状
```
AssertionError: assert sandbox_spec is not None
```

### 原因
代码中硬编码 `sandbox_spec_id='default'`，但系统中没有名为 "default" 的 spec。

### 解决方案
使用实际获取到的 spec.id：

```python
# ❌ 错误
'sandbox_spec_id': sandbox_spec_id or 'default'

# ✅ 正确
actual_spec_id = sandbox_spec_id or (spec.id if spec else 'default')
'sandbox_spec_id': actual_spec_id
```

---

## 问题 6: MCP 连接超时 (根本原因!)

### 症状
前端报错 "Failed to start the conversation from task"，后端日志显示 `httpx.ReadTimeout`。

### 原因
1. Agent server 初始化时尝试连接 MCP server
2. MCP URL: `https://openhands-production-c7c2.up.railway.app/mcp/mcp`
3. 从 Daytona sandbox 连接回 Railway 超时 (30秒)
4. 导致 `POST /api/conversations` 请求超时 (120秒)

### 解决方案
添加环境变量禁用 MCP：

```python
# live_status_app_conversation_service.py
if os.getenv('OH_DISABLE_MCP', 'false').lower() == 'true':
    _logger.info('MCP disabled via OH_DISABLE_MCP environment variable')
    return
```

Railway 环境变量：
```
OH_DISABLE_MCP=true
```

---

## 问题 7: /workspace 目录不存在 (待修复)

### 症状
```
mkdir failed: Error executing command: [Errno 2] No such file or directory: '/workspace'
Git init failed: [Errno 2] No such file or directory: '/workspace/project'
```

### 原因
Daytona snapshot 中没有预创建 `/workspace/project` 目录。

### 当前状态
这是警告，不阻止会话创建。但可能影响 Git 功能。

### 待办
在 snapshot 创建时预创建目录，或在 sandbox 启动时创建。

---

## 调试技巧

### 1. 检查 Daytona sandbox 状态
```python
from daytona_sdk import Daytona
daytona = Daytona()
for sb in daytona.list().items:
    print(f"{sb.id}: {sb.state}")
```

### 2. 检查 Agent server 日志
```python
result = sandbox.process.exec("cat /tmp/agent_server.log | tail -50", timeout=10)
print(result.result)
```

### 3. 测试 signed URL
```bash
curl -s "https://4444-xxx.daytonaproxy01.net/alive"
# 应返回 {"status":"ok"}
```

### 4. Railway 日志监控
```bash
railway logs -n 100 | grep -E "sandbox|agent|MCP|error"
```

---

## 最终配置

### Railway 环境变量
```
DAYTONA_API_KEY=dtn_xxx
DAYTONA_TARGET=eu
DAYTONA_SNAPSHOT=openhands-ready
OH_DISABLE_MCP=true
```

### 关键文件修改
- `openhands/app_server/sandbox/daytona_sandbox_service.py`
- `openhands/app_server/app_conversation/live_status_app_conversation_service.py`
- `pyproject.toml` + `poetry.lock`

---

## 时间线

| 时间 | 问题 | 耗时 |
|------|------|------|
| 开始 | 307 Redirect | ~30min |
| +30min | SDK 版本 | ~15min |
| +45min | poetry.lock | ~10min |
| +55min | nohup 不工作 | ~20min |
| +1h15min | sandbox_spec_id | ~15min |
| +1h30min | MCP 超时 | ~45min |
| **总计** | | **~2h15min** |

---

## 经验教训

1. **Daytona signed URL 是必须的** - 普通 URL 会被 Auth0 拦截
2. **依赖版本要同步** - pyproject.toml 和 poetry.lock 必须一致
3. **nohup 在特殊环境可能不工作** - 优先使用简单的 `&`
4. **网络连通性是关键** - Sandbox 到外部服务的连接可能超时
5. **日志是最好的朋友** - 检查 agent_server.log 能快速定位问题

