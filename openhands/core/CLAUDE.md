# OpenHands Core - 开发说明

## ⚠️ Legacy V0 代码警告

此目录包含 **Legacy V0 代码**，计划于 **2026-04-01** 移除。

### CLI 工具 (`main.py`)

**状态**: ❌ 不再使用

`openhands/core/main.py` 是一个命令行工具，可以在不启动 Web 服务器的情况下直接运行 Agent。

#### 为什么不用

| 原因 | 说明 |
|------|------|
| **架构过时** | 这是 V0 架构，当前使用 V1 (`openhands/app_server/`) |
| **项目实践** | Atoms Plus 使用 Web 服务器模式 |
| **即将移除** | 计划 2026-04-01 删除 |

#### 当前正确的启动方式

```bash
# 后端 (V1 架构)
RUNTIME=local poetry run python -m atoms_plus.atoms_server

# 前端
cd frontend && npm run dev
```

#### CLI 用法 (仅供参考，不推荐使用)

```bash
# 直接执行任务
poetry run python openhands/core/main.py -t "Create a hello world script"

# 指定工作目录
poetry run python openhands/core/main.py -t "Fix bugs" -d ./my-project
```

### V1 架构参考

- **V1 应用服务器**: `openhands/app_server/`
- **V1 Agent SDK**: https://github.com/OpenHands/software-agent-sdk
- **Atoms Plus 入口**: `atoms_plus/atoms_server.py`

---

*最后更新: 2026-03-09*

