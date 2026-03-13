---
name: vibe-coding-e2e-test
description: E2E testing for Vibe Coding flow. Use when testing role detection, instruction injection, code generation quality, or debugging the complete Vibe Coding pipeline.
---

# Vibe Coding E2E Test

End-to-end testing suite for the Vibe Coding feature, verifying the complete flow from user input to web app code generation.

## Test Files

| File | Type | Purpose |
|------|------|---------|
| `tests/e2e/test_vibe_coding_flow.py` | Backend | Role detection, instructions, code quality |
| `tests/e2e/test_vibe_coding_agent.py` | Backend | Full agent code generation with LLM |
| `frontend/tests/vibe-coding-e2e.spec.ts` | Playwright | API endpoints, UI flow |

## Quick Start

### Backend Tests (Python)

```bash
# Run role detection and instruction tests
PYTHONPATH=".:$PYTHONPATH" poetry run python -c "
import asyncio
from atoms_plus.roles.llm_router import detect_role_with_llm
from atoms_plus.roles.vibe_coding_instructions import generate_vibe_coding_instructions

async def test():
    result = await detect_role_with_llm('做一个番茄钟应用')
    print(f'Role: {result.role_id}')
    print(f'Web App: {result.is_web_app_task}')

    instructions = generate_vibe_coding_instructions(result.role_id, result.is_web_app_task)
    print(f'Instructions: {len(instructions)} chars')

asyncio.run(test())
"
```

### Frontend Tests (Playwright)

**⚠️ 重要**: 使用测试运行脚本以获取格式化的报告输出！

```bash
# 推荐：使用测试脚本（自动输出报告）
./scripts/run-vibe-coding-tests.sh

# 包含完整 Agent 流程测试
./scripts/run-vibe-coding-tests.sh --full

# 针对生产环境测试
./scripts/run-vibe-coding-tests.sh --prod

# 两者结合
./scripts/run-vibe-coding-tests.sh --full --prod
```

直接运行 Playwright（无报告头尾）:
```bash
# 基础测试
cd frontend && TEST_VIBE_CODING=1 npx playwright test vibe-coding-e2e.spec.ts --project=chromium

# 包含完整流程
TEST_FULL_FLOW=1 TEST_VIBE_CODING=1 npx playwright test vibe-coding-e2e.spec.ts
```

## Test Coverage

```
用户输入 → WebSocket → 角色检测 → 指令注入 → Agent 执行 → 代码生成 → Preview 显示
   ✅         ⏭️          ✅          ✅          ✅          ✅          ✅ (UI)
```

| Component | Backend Test | Frontend Test |
|-----------|-------------|---------------|
| Role Detection | ✅ `test_role_detection_for_web_app` | ✅ API test |
| Instructions | ✅ `test_vibe_coding_instructions_generation` | ✅ API test |
| Code Generation | ✅ `test_complete_vibe_coding_flow` | ⏭️ (needs auth) |
| Preview UI | - | ✅ `auto-preview.spec.ts` |

## Code Quality Checks

The tests validate generated code against these criteria:

| Check | Description |
|-------|-------------|
| Has React Import | `useState` or `react` in code |
| Has useState Hook | State management present |
| Has JSX Return | Returns JSX elements |
| Has Tailwind Classes | Uses `className` with Tailwind |
| Has Click Handler | `onClick` or event handlers |
| Has Function Component | `function` or `const` component |
| Has Export | `export` statement present |
| No Markdown Wrapper | No ``` wrappers in output |

**Pass threshold**: 70% (7/8 checks)

## 测试脚本选项

| 命令 | 描述 |
|------|------|
| `./scripts/run-vibe-coding-tests.sh` | 运行标准测试（跳过 Agent 流程） |
| `./scripts/run-vibe-coding-tests.sh --full` | 包含完整 Agent 流程测试 |
| `./scripts/run-vibe-coding-tests.sh --prod` | 针对生产环境测试 |
| `./scripts/run-vibe-coding-tests.sh --full --prod` | 生产环境 + 完整流程 |


## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DASHSCOPE_API_KEY` | - | Alibaba Cloud API key |
| `LLM_API_KEY` | - | Alternative LLM API key |
| `TEST_VIBE_CODING` | `1` | 由脚本自动设置 |
| `TEST_FULL_FLOW` | - | 启用完整 Agent 流程测试 |
| `TEST_PROD` | - | 使用生产环境 URL |
| `LOCAL_FRONTEND_URL` | `http://localhost:3002` | 本地前端 URL |

## Expected Results

### Playwright 测试报告输出

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                     🧪 VIBE CODING E2E TEST RUNNER                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Environment: LOCAL                                                           ║
║  Backend: http://localhost:3000                                               ║
║  Frontend: http://localhost:3002                                              ║
║  TEST_FULL_FLOW: 0                                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

Running 8 tests using 7 workers

  ✓  3 [chromium] › 2. Vibe Coding instructions contain required sections (544ms)
  ✓  4 [chromium] › 1. Role detection returns correct role and web_app flag (547ms)
  -  1 [chromium] › 6. Complete user flow: input → agent → code → preview
  -  2 [chromium] › 7. Quick agent response test (validates agent starts)
  ✓  8 [chromium] › 8. WebSocket connection test (237ms)
  ✓  6 [chromium] › 5. Complete conversation flow - infrastructure check (866ms)
  ✓  5 [chromium] › 3. Homepage loads and shows chat interface (4.8s)
  ✓  7 [chromium] › 4. Preview tab is accessible (4.9s)

  2 skipped
  6 passed (9.1s)

╔══════════════════════════════════════════════════════════════════════════════╗
║  ✅ ALL TESTS COMPLETED SUCCESSFULLY                                         ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Python 后端测试输出


```
======================================================================
🧪 Vibe Coding E2E Test Suite
======================================================================

📝 Test 1: Role Detection for Web App
--------------------------------------------------
  ✅ "做一个番茄钟应用..." → role-engineer
  ✅ "帮我写一个 React 组件..." → role-engineer
  ✅ "设计电商网站架构..." → role-architect
  Result: 3/3 passed

📝 Test 2: Role Detection for Non-Web App
--------------------------------------------------
  ✅ "研究最新的 AI 趋势..." → role-researcher
  ✅ "帮我写 PRD 文档..." → role-product-manager
  Result: 2/2 passed

📝 Test 3: Vibe Coding Instructions
--------------------------------------------------
  ✅ Length > 500
  ✅ Has MANDATORY
  ✅ Has React/Web

🎯 Total: 3/3 tests passed
======================================================================
```

## Troubleshooting

### Module Not Found

```
ModuleNotFoundError: No module named 'litellm'
```

**Solution**: Run from project root with correct PYTHONPATH:
```bash
PYTHONPATH=".:$PYTHONPATH" poetry run python ...
```

### Low Code Quality Score

```
Code quality too low: 5/8
```

**Solution**: Check if LLM is returning markdown wrappers. Update the prompt to request raw code only.

### API Key Missing

```
No LLM API key configured
```

**Solution**: Set environment variable:
```bash
export DASHSCOPE_API_KEY=sk-xxx
```

## Related Files

- `atoms_plus/roles/llm_router.py` - LLM-based role detection
- `atoms_plus/roles/vibe_coding_instructions.py` - Instruction generator
- `atoms_plus/roles/api.py` - `/api/v1/roles/*` endpoints
- `frontend/src/hooks/use-auto-preview.ts` - Preview automation
