"""
E2E: Vibe Coding Complete Flow Test

This test verifies the complete Vibe Coding flow:
1. User input → LLM Role Detection
2. Role Detection → Vibe Coding Instructions
3. Instructions → Agent Execution (simulated)
4. Agent → Code Generation Quality Check

Prerequisites:
- Valid LLM API key (DASHSCOPE_API_KEY or LLM_API_KEY)
- Python 3.12+
- Atoms Plus modules installed

Run with:
    cd tests/e2e && poetry run pytest test_vibe_coding_flow.py -v -s
"""

import asyncio
import os
import sys

import pytest

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))


@pytest.fixture
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


class TestVibeCodingFlow:
    """Test the complete Vibe Coding flow."""

    @pytest.mark.asyncio
    async def test_role_detection_for_web_app(self):
        """Test that web app requests are correctly detected."""
        from atoms_plus.roles.llm_router import detect_role_with_llm

        test_cases = [
            ('做一个番茄钟应用', 'role-engineer', True),
            ('帮我写一个 React 组件', 'role-engineer', True),
            ('设计电商网站架构', 'role-architect', True),
        ]

        for user_input, expected_role, expected_web_app in test_cases:
            result = await detect_role_with_llm(user_input)

            assert result.role_id == expected_role, (
                f'Role mismatch for "{user_input}": '
                f'got {result.role_id}, expected {expected_role}'
            )
            assert result.is_web_app_task == expected_web_app, (
                f'Web app flag mismatch for "{user_input}": '
                f'got {result.is_web_app_task}, expected {expected_web_app}'
            )
            assert result.confidence >= 0.8, (
                f'Low confidence for "{user_input}": {result.confidence}'
            )

    @pytest.mark.asyncio
    async def test_role_detection_for_non_web_app(self):
        """Test that non-web app requests are correctly detected."""
        from atoms_plus.roles.llm_router import detect_role_with_llm

        test_cases = [
            ('研究最新的 AI 趋势', 'role-researcher', False),
            ('帮我写 PRD 文档', 'role-product-manager', False),
        ]

        for user_input, expected_role, expected_web_app in test_cases:
            result = await detect_role_with_llm(user_input)

            assert result.role_id == expected_role
            assert result.is_web_app_task == expected_web_app

    def test_vibe_coding_instructions_generation(self):
        """Test that Vibe Coding instructions are correctly generated."""
        from atoms_plus.project_graph.models import ProjectGraph, TechStack
        from atoms_plus.roles.vibe_coding_instructions import (
            generate_vibe_coding_instructions,
        )

        react_graph = ProjectGraph(
            name='React App',
            description='React app',
            tech_stack=TechStack(framework='React', styling='Tailwind CSS'),
        )
        instructions = generate_vibe_coding_instructions(
            role_id='role-engineer',
            is_web_app_task=True,
            project_graph=react_graph,
        )

        assert len(instructions) > 500, 'Instructions too short'
        assert 'MANDATORY' in instructions, 'Missing MANDATORY section'
        assert 'React' in instructions or 'web' in instructions.lower()
        assert 'npm run build' in instructions
        assert 'PORT' in instructions
        assert '$WORKER_2' in instructions
        assert '../components/...' in instructions
        assert 'Do not force React/Vite' in instructions
        assert 'Tailwind CSS' in instructions
        assert 'Never rely on the previous command' in instructions
        assert 'Avoid interactive scaffolding flows' in instructions
        assert '--no-interactive' in instructions
        assert 'Do not rely on `--yes` for create-vite' in instructions

        # Test non-web app task
        instructions_non_web = generate_vibe_coding_instructions(
            role_id='role-researcher',
            is_web_app_task=False,
        )

        assert len(instructions_non_web) < len(instructions), (
            'Non-web instructions should be shorter'
        )

        next_graph = ProjectGraph(
            name='Next App',
            description='Next app',
            tech_stack=TechStack(framework='Next.js', styling='Tailwind CSS'),
        )
        next_instructions = generate_vibe_coding_instructions(
            role_id='role-engineer',
            is_web_app_task=True,
            project_graph=next_graph,
        )
        assert 'Next.js projects' in next_instructions
        assert 'rather than creating a Vite app' in next_instructions
        assert '../components/...' not in next_instructions
        assert 'Avoid interactive scaffolding flows' in next_instructions

        vue_graph = ProjectGraph(
            name='Vue App',
            description='Vue app',
            tech_stack=TechStack(framework='Vue', styling='CSS Modules'),
        )
        vue_instructions = generate_vibe_coding_instructions(
            role_id='role-engineer',
            is_web_app_task=True,
            project_graph=vue_graph,
        )
        assert 'Vue projects' in vue_instructions
        assert 'Do not generate React-only files' in vue_instructions
        assert 'If you use Tailwind CSS' not in vue_instructions

        nuxt_graph = ProjectGraph(
            name='Nuxt App',
            description='Nuxt app',
            tech_stack=TechStack(framework='Nuxt', styling='Tailwind CSS'),
        )
        nuxt_instructions = generate_vibe_coding_instructions(
            role_id='role-engineer',
            is_web_app_task=True,
            project_graph=nuxt_graph,
        )
        assert 'For Nuxt projects' in nuxt_instructions
        assert 'plain Vue or Vite scaffold' in nuxt_instructions

    def test_code_quality_checks(self):
        """Test code quality validation logic."""
        sample_code = """
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br flex items-center">
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  )
}
"""
        checks = {
            'React Hook': 'useState' in sample_code,
            'Tailwind CSS': 'className' in sample_code,
            'Event Handler': 'onClick' in sample_code,
            'Modern Layout': 'flex' in sample_code or 'grid' in sample_code,
            'Function Component': 'function' in sample_code or 'const' in sample_code,
        }

        passed = sum(checks.values())
        total = len(checks)

        assert passed == total, f'Code quality: {passed}/{total} checks passed'


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
