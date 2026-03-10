# 本地测试状态报告

**日期**: 2026-03-10
**版本**: v0.3.1
**状态**: ✅ 全部测试通过

## 🎯 测试目标

确保 Agent 能够：
1. ✅ 在 `ProcessSandbox` 环境中加载项目特定的 microagents
2. ✅ 正确响应用户消息
3. ✅ 触发关键词匹配的 microagents
4. ✅ 执行 scaffolding 任务

## ✅ 已完成

### 1. Microagents 加载问题修复 (v0.3.1 更新)

**问题**: `ProcessSandboxService` 创建空的 sandbox 目录，不包含 `.openhands/microagents/`

**解决方案**: 在 `_create_sandbox_directory()` 中自动复制 `.openhands/` 目录到 sandbox

| 文件 | 修改内容 |
|------|----------|
| `openhands/app_server/sandbox/process_sandbox_service.py` | 添加 `_copy_openhands_directory()` 方法，在创建 sandbox 时复制 `.openhands/` |

**复制逻辑**:
```
OH_PROJECT_ROOT (或 cwd) → sandbox/.openhands/
```

**验证结果**:
```
Total skills: 59
Key skills:
  ✅ vibe-coding (scaffolding)
  ✅ typescript-validation
  ✅ role-engineer
  ✅ atoms-plus
```

### 2. V1 对话创建流程 ✅

```bash
# 1. 创建 V1 对话
POST /api/v1/app-conversations
# 返回 start_task_id

# 2. 轮询检查状态
GET /api/v1/app-conversations/start-tasks?ids={start_task_id}
# 状态变为 READY 后获取 conversation_id 和 session_api_key

# 3. 发送消息 (正确格式!)
POST /api/conversations/{CONV_ID}/events
Headers:
  Content-Type: application/json
  X-Session-API-Key: {session_api_key}
Body:
{
  "role": "user",
  "content": [{"type": "text", "text": "Your message"}],
  "run": true
}
```

### 3. Agent 响应测试 ✅

**测试时间**: 2026-03-10 22:00:32

**验证结果**:
- 消息发送: `{"success": true}`
- 事件数量: 7+ 个事件
- Agent 响应: "Yes, I'm working and ready to help!"

### 4. Microagent 触发测试 ✅

**测试请求**: "Create a simple React project with a counter component that has a bug..."

**触发的 Microagents**:
```
Skill 'role-engineer' triggered by keyword 'fix'
Skill 'typescript-validation' triggered by keyword 'vite'
```

### 5. Scaffolding E2E 测试 ✅

**生成的项目**: `/tmp/openhands-sandboxes/{sandbox_id}/counter-app`

**项目结构**:
```
counter-app/
├── index.html
├── package.json
├── vite.config.ts         # ✅ 包含 vite-plugin-checker
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── Counter.tsx        # ✅ 包含故意的 bug (count + 2)
│   └── ...
└── node_modules/
```

**vite.config.ts 内容**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      overlay: true,
      terminal: true,
    }),
  ],
})
```

**Counter.tsx 中的故意 bug**:
```typescript
const increment = () => {
  // Bug: This increments by 2 instead of 1
  setCount(count + 2)
}
```

## 🔧 本地启动命令

```bash
# 设置环境变量
export RUNTIME=local
export LLM_API_KEY="sk-..."
export LLM_BASE_URL="https://coding.dashscope.aliyuncs.com/v1"
export LLM_MODEL="openai/MiniMax-M2.5"

# 可选: 指定项目根目录 (默认使用 cwd)
# export OH_PROJECT_ROOT="/path/to/atoms-plus"

# 启动后端
poetry run python -m atoms_plus.atoms_server

# 启动前端
cd frontend && npm run dev -- --port 3003
```

## ⚠️ 注意事项

1. **V1 vs V0**: 必须使用 V1 端点 (`/api/v1/app-conversations`) 才能触发 `ProcessSandboxService`
2. **UUID 格式**: agent_server 要求带破折号的 UUID 格式
3. **session_api_key**: 从 `/api/v1/app-conversations?ids={id}` 获取，用于 Agent API 认证

## 📁 关键文件

| 文件 | 说明 |
|------|------|
| `.openhands/microagents/scaffolding.md` | 项目脚手架指南 (name: vibe-coding) |
| `.openhands/microagents/typescript-validation.md` | TypeScript 验证指南 |
| `openhands/app_server/sandbox/process_sandbox_service.py` | Sandbox 服务 (含 `.openhands` 复制逻辑) |

## 📋 后续任务 (可选)

1. **TypeScript 错误检测测试**: 在生成的项目中运行 `npm run dev`，验证 vite-plugin-checker 能检测并报告错误
2. **自动修复测试**: 验证 Agent 能否根据 typescript-validation microagent 自动修复错误
3. **MCP 集成**: 启用文件系统/Git MCP 服务器以增强 Agent 能力

