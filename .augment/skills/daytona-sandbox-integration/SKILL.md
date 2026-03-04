---
name: daytona-sandbox-integration
description: Daytona sandbox integration for OpenHands/Atoms Plus. Use when working with cloud sandboxes, runtime isolation, or Vibe Coding features requiring secure code execution environments.
---

# Daytona Sandbox Integration

Daytona provides secure, isolated cloud sandboxes for AI agent code execution. This skill covers integration patterns, deployment configuration, and troubleshooting for the Atoms Plus project.

## When to Use This Skill

- Configuring Daytona runtime for OpenHands
- Deploying services with sandbox isolation
- Troubleshooting sandbox creation issues
- Understanding the sandbox lifecycle
- Implementing "Vibe Coding" (zero-intervention app generation)

## Project Configuration

### Railway Environment Variables

```bash
# Required for Daytona runtime
RUNTIME=daytona
DAYTONA_API_KEY=your_api_key_here
DAYTONA_API_URL=https://app.daytona.io/api  # Default
DAYTONA_TARGET=eu                            # eu or us

# LLM Configuration (still required)
LLM_API_KEY=your_llm_api_key
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus
```

### Runtime Comparison

| Feature | `RUNTIME=local` | `RUNTIME=daytona` |
|---------|-----------------|-------------------|
| 文件隔离 | ❌ 无 | ✅ 完全隔离 |
| 网络隔离 | ❌ 无 | ✅ 独立网络 |
| 安全性 | ⚠️ 仅开发 | ✅ 生产就绪 |
| 成本 | ✅ 零成本 | ⚠️ 按用量计费 |
| 启动时间 | ✅ 即时 | ⚠️ ~10秒 |
| Docker 依赖 | ❌ 无需 | ❌ 无需 |

## Key Files

### Daytona Runtime Implementation

```
third_party/runtime/impl/daytona/
├── daytona_runtime.py      # DaytonaRuntime class
└── requirements.txt

openhands/app_server/sandbox/
└── daytona_sandbox_service.py  # V1 sandbox service
```

### Dependency Configuration

**pyproject.toml:**
```toml
[project.optional-dependencies]
third_party_runtimes = [
    "daytona>=0.24.2",
    # ... other runtimes
]
```

**Dockerfile (containers/app/Dockerfile):**
```dockerfile
RUN poetry install --extras third_party_runtimes
```

## Sandbox Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    Daytona Sandbox Lifecycle                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Request Conversation                                        │
│      └── POST /api/v1/app-conversations                         │
│                                                                  │
│   2. Create Sandbox (RUNTIME=daytona)                           │
│      └── Daytona SDK → creates isolated container               │
│      └── Status: WORKING → sandbox_id assigned                  │
│                                                                  │
│   3. Sandbox Running                                             │
│      └── Agent Server starts on port 8000                       │
│      └── Status: RUNNING                                        │
│                                                                  │
│   4. Execute Tasks                                               │
│      └── Agent executes code in isolated environment            │
│                                                                  │
│   5. Cleanup                                                     │
│      └── Sandbox destroyed after session ends                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Check Sandbox Status

```bash
# List sandboxes
curl https://your-backend.railway.app/api/v1/sandboxes

# Get specific sandbox
curl "https://your-backend.railway.app/api/v1/sandboxes?id=SANDBOX_ID"
```

### Sandbox Response Example

```json
{
  "id": "6C9JTtIwEmpkD1OCi9oH4B",
  "status": "RUNNING",
  "sandbox_spec_id": "ghcr.io/openhands/agent-server:010e847-python",
  "session_api_key": "...",
  "exposed_urls": [
    {"name": "AGENT_SERVER", "url": "/runtime/8000", "port": 8000}
  ],
  "working_dir": "/tmp/openhands-sandboxes/6C9JTtIwEmpkD1OCi9oH4B",
  "created_at": "2026-03-04T13:53:32.036158Z"
}
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 404 on sandbox endpoints | 代码未部署 | 确保 feature 分支已合并到 main |
| `settings is not None` AssertionError | V1 API 需要用户设置 | 通过前端配置 LLM 设置 |
| `Git command not found` | 沙盒内缺少 git | 可忽略（警告级别） |
| Sandbox 创建超时 | Daytona API 延迟 | 检查 DAYTONA_API_URL 配置 |

### Verify Daytona Configuration

```bash
# Check Railway variables
railway variables | grep -E "(RUNTIME|DAYTONA)"

# Test sandbox creation (requires frontend LLM settings)
curl -X POST https://backend/api/v1/app-conversations \
  -H "Content-Type: application/json" \
  -d '{"initial_message": {"role": "user", "content": [{"type": "text", "text": "test"}]}}'
```

## Deployment Services

| Service | URL | Runtime |
|---------|-----|---------|
| Production | openhands-production-c7c2.up.railway.app | `local` |
| Daytona Test | daytona-test-production.up.railway.app | `daytona` |

## Getting Daytona API Key

1. Visit https://app.daytona.io
2. Sign up / Login
3. Go to Settings → API Keys
4. Create new API Key
5. Add to Railway as `DAYTONA_API_KEY`

