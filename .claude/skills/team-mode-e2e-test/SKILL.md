---
name: team-mode-e2e-test
description: CLI tool for Team Mode diagnostics and E2E testing. Use when checking deployment status, testing Team Mode locally, debugging WebSocket connections, or validating agent workflows.
---

# Team Mode CLI

CLI tool for deployment diagnostics and end-to-end testing of Team Mode multi-agent collaboration.

## Commands

| Command | Description |
|---------|-------------|
| `status` | Quick deployment status check (default) |
| `test` | Run full E2E test |

## Quick Start

```bash
# Quick deployment status check (default command)
poetry run python -m atoms_plus.team_mode.e2e_test status

# Full E2E test
poetry run python -m atoms_plus.team_mode.e2e_test test

# E2E test with custom task
poetry run python -m atoms_plus.team_mode.e2e_test test --task "Create a REST API with FastAPI"

# E2E test with custom model
poetry run python -m atoms_plus.team_mode.e2e_test test --model openai/qwen-plus

# Verbose E2E test
poetry run python -m atoms_plus.team_mode.e2e_test test -v
```

## Status Command

Quick check of all services and API endpoints:

```bash
poetry run python -m atoms_plus.team_mode.e2e_test status
```

**Output:**
```
═══════════════════════════════════════════════════════════
  Atoms Plus 部署状态
═══════════════════════════════════════════════════════════

服务状态:
  后端: ✅ http://localhost:3000 (v0.3.0)
  前端: ✅ http://localhost:3002

API 端点:
  Team Mode: ✅
  Race Mode: ✅
  Agent Roles: ✅
  Scaffolding: ✅

运行进程:
  PID 56021: /opt/homebrew/.../Python -m atoms_plus.atoms_server...

✓ 所有服务正常运行
```

**Checks performed:**
- Backend `/atoms-plus` API response + version
- Frontend accessibility on port 3002
- Each feature endpoint (Team/Race/Roles/Scaffolding)
- Running `atoms_plus` processes via `pgrep`

## Prerequisites

1. **Backend Running**: Start the Atoms Plus server first
   ```bash
   NO_PROXY=localhost,127.0.0.1 PORT=3000 RUNTIME=local OH_ENABLE_BROWSER=false \
     SKIP_DEPENDENCY_CHECK=1 poetry run python -m atoms_plus.atoms_server
   ```

2. **LLM Configuration**: Ensure `~/.openhands/settings.json` has valid credentials
   ```json
   {
     "llm_model": "openai/MiniMax-M2.5",
     "llm_api_key": "sk-xxx",
     "llm_base_url": "https://coding.dashscope.aliyuncs.com/v1"
   }
   ```

## CLI Options

### Global Options

| Option | Default | Description |
|--------|---------|-------------|
| `--host` | `localhost` | Backend host |
| `--port` | `3000` | Backend port |
| `--frontend-port` | `3002` | Frontend port (for status check) |

### Test Command Options

| Option | Default | Description |
|--------|---------|-------------|
| `--task` | Hello World script | Task description |
| `--model` | From settings.json | LLM model (e.g., `openai/qwen-plus`) |
| `--skip-clarification` | `True` | Auto-skip HITL clarification |
| `--timeout` | `300` | WebSocket timeout in seconds |
| `-v, --verbose` | `False` | Verbose output |

### Status Command Options

| Option | Default | Description |
|--------|---------|-------------|
| `-q, --quiet` | `False` | Minimal output |

## Test Flow

1. **Health Check**: Verifies `/atoms-plus/health` endpoint
2. **Create Session**: POSTs to `/api/v1/team/sessions`
3. **WebSocket Stream**: Connects to `/api/v1/team/sessions/{id}/stream`
4. **Agent Workflow**: PM → Architect → Engineer

## Expected Output

```
═══════════════════════════════════════════════════════════
  Team Mode E2E Test
═══════════════════════════════════════════════════════════
  Host: localhost:3000
  Model: openai/MiniMax-M2.5
  Task: 创建一个简单的 Python Hello World 脚本...
═══════════════════════════════════════════════════════════

[1/3] Checking backend health...
✓ Backend healthy: {'status': 'ok', 'service': 'atoms-plus'}

[2/3] Creating session...
✓ Session created: abc123-...
  Mode: plan_only, Model: openai/MiniMax-M2.5

[3/3] Streaming session...
✓ WebSocket connected

=== Session Started ===

[PM] (thinking)
  Analyzing requirements for ambiguity...

[PM] (waiting)
  Found 1 ambiguous aspects...

[INTERRUPT] Type: clarification:questions
  Q: Could you provide more details?
  → Auto-skipping clarification...

[RESUMED] Continuing after clarification...

[PM] (responding)
  Requirements analysis complete...

[ARCHITECT] (thinking)
  Designing architecture...

[ENGINEER] (responding)
  Implementation complete...

=== Session Completed ===

✓ E2E Test PASSED
```

## Troubleshooting

### Authentication Error
```
[ERROR] litellm.AuthenticationError: The api_key client option must be set
```
**Solution**: Ensure `~/.openhands/settings.json` has valid `llm_api_key` and `llm_base_url`.

### Model Format Error
```
[ERROR] LLM Provider NOT provided. Pass model as openai/qwen-plus
```
**Solution**: Model must include provider prefix (e.g., `openai/qwen-plus`, not just `qwen-plus`).

### Backend Unreachable
```
✗ Backend unreachable: Connection refused
```
**Solution**: Start the backend server first:
```bash
NO_PROXY=localhost,127.0.0.1 PORT=3000 RUNTIME=local OH_ENABLE_BROWSER=false \
  SKIP_DEPENDENCY_CHECK=1 poetry run python -m atoms_plus.atoms_server
```

### SOCKS Proxy Error
```
✗ WebSocket error: python-socks is required to use a SOCKS proxy
```
**Solution**: Clear proxy environment variables:
```bash
NO_PROXY=localhost,127.0.0.1 ALL_PROXY= HTTP_PROXY= HTTPS_PROXY= \
  poetry run python -m atoms_plus.team_mode.e2e_test
```

### WebSocket Timeout
```
⚠ Timeout after 300s waiting for events
```
**Solution**: Check backend logs for LLM API errors. Increase timeout with `--timeout 600`.

## Test Cases

| Scenario | Command | Expected Result |
|----------|---------|-----------------|
| Status Check | `status` | Shows all services |
| Basic E2E Test | `test` | PASSED |
| Custom Task | `test --task "Create a REST API"` | PASSED |
| Invalid Model | `test --model invalid` | FAILED (auth error) |
| No Backend | `status` (backend stopped) | Shows ❌ for backend |

## Related Files

- `atoms_plus/team_mode/e2e_test.py` - CLI implementation
- `atoms_plus/team_mode/api.py` - Team Mode API endpoints
- `atoms_plus/team_mode/graph.py` - LangGraph workflow
- `~/.openhands/settings.json` - User LLM configuration

