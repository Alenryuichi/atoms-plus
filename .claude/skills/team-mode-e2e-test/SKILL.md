---
name: team-mode-e2e-test
description: End-to-end testing tool for Team Mode multi-agent collaboration. Use when testing Team Mode locally, debugging WebSocket connections, or validating agent workflows.
---

# Team Mode E2E Test

CLI tool for end-to-end testing of Team Mode multi-agent collaboration.

## Quick Start

```bash
# Basic test with default settings
poetry run python -m atoms_plus.team_mode.e2e_test

# Custom task
poetry run python -m atoms_plus.team_mode.e2e_test --task "Create a REST API with FastAPI"

# Custom model
poetry run python -m atoms_plus.team_mode.e2e_test --model openai/qwen-plus

# Verbose output
poetry run python -m atoms_plus.team_mode.e2e_test -v
```

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

| Option | Default | Description |
|--------|---------|-------------|
| `--host` | `localhost` | Backend host |
| `--port` | `3000` | Backend port |
| `--task` | Hello World script | Task description |
| `--model` | From settings.json | LLM model (e.g., `openai/qwen-plus`) |
| `--skip-clarification` | `True` | Auto-skip HITL clarification |
| `--timeout` | `300` | WebSocket timeout in seconds |
| `-v, --verbose` | `False` | Verbose output |

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
| Basic Hello World | `poetry run python -m atoms_plus.team_mode.e2e_test` | PASSED |
| Custom Task | `--task "Create a REST API"` | PASSED |
| Invalid Model | `--model invalid` | FAILED (auth error) |
| No Backend | (backend stopped) | FAILED (unreachable) |

## Related Files

- `atoms_plus/team_mode/e2e_test.py` - CLI implementation
- `atoms_plus/team_mode/api.py` - Team Mode API endpoints
- `atoms_plus/team_mode/graph.py` - LangGraph workflow
- `~/.openhands/settings.json` - User LLM configuration

