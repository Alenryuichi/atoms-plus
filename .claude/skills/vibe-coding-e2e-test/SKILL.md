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

```bash
# Run Playwright tests
cd frontend && npx playwright test vibe-coding-e2e.spec.ts --project=chromium

# With full UI flow (requires auth)
TEST_VIBE_CODING=1 npx playwright test vibe-coding-e2e.spec.ts
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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DASHSCOPE_API_KEY` | - | Alibaba Cloud API key |
| `LLM_API_KEY` | - | Alternative LLM API key |
| `TEST_VIBE_CODING` | - | Enable full UI tests |
| `VITE_BACKEND_BASE_URL` | Production URL | Backend URL for tests |

## Expected Results

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
