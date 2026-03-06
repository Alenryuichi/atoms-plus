# ProcessSandboxService 详解

> V1 架构的本地沙盒实现，通过为每个会话创建独立的 Python 子进程来实现隔离。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ProcessSandboxService 架构                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  atoms_server.py (主进程, 端口 3000)                                │
│       │                                                             │
│       │  start_sandbox()                                            │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              ProcessSandboxService                          │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  _processes: dict[sandbox_id, ProcessInfo]          │   │   │
│  │  │                                                     │   │   │
│  │  │  sandbox_001 → PID 8003, port 8003, /tmp/.../001   │   │   │
│  │  │  sandbox_002 → PID 8004, port 8004, /tmp/.../002   │   │   │
│  │  │  sandbox_003 → PID 8005, port 8005, /tmp/.../003   │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│  │ Agent    │  │ Agent    │  │ Agent    │  ← 独立 Python 进程      │
│  │ Server   │  │ Server   │  │ Server   │                          │
│  │ :8003    │  │ :8004    │  │ :8005    │                          │
│  │          │  │          │  │          │                          │
│  │ /tmp/... │  │ /tmp/... │  │ /tmp/... │  ← 隔离工作目录          │
│  │ /001/    │  │ /002/    │  │ /003/    │                          │
│  └──────────┘  └──────────┘  └──────────┘                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 源码位置

```
openhands/app_server/sandbox/process_sandbox_service.py
```

## 关键属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `base_working_dir` | str | `/tmp/openhands-sandboxes` | 沙盒工作目录的父目录 |
| `base_port` | int | `8000` | Agent Server 起始端口 |
| `python_executable` | str | `sys.executable` | Python 解释器路径 |
| `agent_server_module` | str | `openhands.agent_server` | Agent Server 模块 |
| `exposed_url_pattern` | str | `/runtime/{port}` | 前端访问 URL 模式 |

## 核心方法

### 1. `start_sandbox()` - 创建沙盒

```python
async def start_sandbox(self, sandbox_spec_id=None, sandbox_id=None) -> SandboxInfo:
```

**流程：**
1. 生成唯一 `sandbox_id` (Base62 编码的随机字节)
2. 生成 `session_api_key` (用于认证)
3. 查找可用端口 (`_find_unused_port`)
4. 创建沙盒目录 + 初始化 Git (`_create_sandbox_directory`)
5. 启动 Agent Server 子进程 (`_start_agent_process`)
6. 等待服务器就绪 (`_wait_for_server_ready`)
7. 存储到 `_processes` 字典

**启动的命令：**
```bash
python -m openhands.agent_server --port 8003
```

**环境变量：**
```bash
SESSION_API_KEY=xxx                           # 会话认证
WORKSPACE_BASE=/tmp/openhands-sandboxes/001   # 工作目录
OH_CONVERSATIONS_PATH=/tmp/openhands-data/001/conversations
OH_BASH_EVENTS_DIR=/tmp/openhands-data/001/bash_events
```

### 2. `_create_sandbox_directory()` - 创建目录 + Git 初始化

```python
def _create_sandbox_directory(self, sandbox_id: str) -> str:
```

**做了什么：**
1. 创建 `/tmp/openhands-sandboxes/{sandbox_id}/` 目录
2. 运行 `git init`
3. 配置 `git config user.email/name`

**为什么要 Git？**
- 前端 "Changes" 标签页需要 `git diff` 来显示文件更改
- 没有 Git 初始化，Changes 功能不工作

### 3. `_wait_for_server_ready()` - 等待服务就绪

```python
async def _wait_for_server_ready(self, port, timeout=240, process=None) -> bool:
```

**轮询逻辑：**
```python
while time.time() - start_time < timeout:
    response = await httpx_client.get(f'http://localhost:{port}/alive')
    if response.json().get('status') == 'ok':
        return True
    await asyncio.sleep(1)
```

**超时：240秒 (4分钟)** - 为云环境资源受限情况设计

### 4. `delete_sandbox()` - 删除沙盒

```python
async def delete_sandbox(self, sandbox_id: str) -> bool:
```

**清理流程：**
1. 使用 `psutil.Process.terminate()` 优雅终止
2. 等待 10 秒，超时则 `kill()`
3. 删除工作目录 `shutil.rmtree()`
4. 从 `_processes` 移除

### 5. `pause_sandbox()` / `resume_sandbox()` - 暂停/恢复

```python
async def pause_sandbox(self, sandbox_id: str) -> bool:
async def resume_sandbox(self, sandbox_id: str) -> bool:
```

使用 `psutil.Process.suspend()` / `resume()` 控制进程状态。

## 状态管理

**`_processes` 全局字典：**
```python
_processes: dict[str, ProcessInfo] = {}

# ProcessInfo 包含：
class ProcessInfo(BaseModel):
    pid: int                    # 进程 PID
    port: int                   # Agent Server 端口
    user_id: str | None         # 用户 ID
    working_dir: str            # 工作目录
    session_api_key: str        # 会话 API Key
    created_at: datetime        # 创建时间
    sandbox_spec_id: str        # 沙盒规格 ID
```

**状态检测 (`_get_process_status`)：**
```python
process = psutil.Process(pid)
if process.status() in (RUNNING, SLEEPING, DISK_SLEEP):
    return SandboxStatus.RUNNING
elif process.status() == STOPPED:
    return SandboxStatus.PAUSED
elif process.status() == ZOMBIE:
    return SandboxStatus.ERROR
```

## 与其他 SandboxService 的对比

| 特性 | ProcessSandboxService | RemoteSandboxService | DaytonaSandboxService |
|------|----------------------|---------------------|----------------------|
| **隔离方式** | 进程 + 目录 | Docker 容器 | 云端 VM |
| **适用场景** | 本地开发 | 生产部署 | 云端沙盒 |
| **安全性** | 🟡 中 | 🟢 高 | 🟢 高 |
| **资源开销** | 低 | 中 | 高 |
| **启动速度** | 快 (1-5秒) | 中 (10-30秒) | 慢 (30-60秒) |
| **持久化** | 本地文件系统 | Docker Volume | Daytona 存储 |

## 调试命令

```bash
# 查看运行中的沙盒进程
ps aux | grep "openhands.agent_server"

# 查看沙盒目录
ls -la /tmp/openhands-sandboxes/

# 清理所有沙盒
rm -rf /tmp/openhands-sandboxes/*

# 清理超过1天的沙盒
find /tmp/openhands-sandboxes -maxdepth 1 -type d -mtime +1 -exec rm -rf {} \;
```

## 相关文件

- `openhands/app_server/sandbox/process_sandbox_service.py` - 主实现
- `openhands/app_server/sandbox/sandbox_service.py` - 基类接口
- `openhands/app_server/sandbox/sandbox_models.py` - 数据模型
- `openhands/agent_server/__main__.py` - Agent Server 入口

