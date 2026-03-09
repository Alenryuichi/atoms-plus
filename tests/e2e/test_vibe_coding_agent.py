"""
E2E: Vibe Coding Agent Execution Test

This test simulates the complete agent execution flow with actual LLM calls
to verify that the Vibe Coding system produces runnable web application code.

Prerequisites:
- Valid LLM API key configured
- Network access to LLM provider

Run with:
    cd tests/e2e && poetry run pytest test_vibe_coding_agent.py -v -s --timeout=180
"""

import asyncio
import os
import re
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))


def check_llm_api_available() -> bool:
    """Check if LLM API is available."""
    keys = ['DASHSCOPE_API_KEY', 'LLM_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY']
    return any(os.environ.get(k) for k in keys)


@pytest.fixture
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


class TestVibeCodingAgentExecution:
    """Test complete agent execution with LLM code generation."""

    @pytest.mark.asyncio
    @pytest.mark.skipif(not check_llm_api_available(), reason='No LLM API key')
    async def test_complete_vibe_coding_flow(self):
        """Test complete flow: input → detection → instructions → code gen."""
        import litellm

        from atoms_plus.roles.llm_router import detect_role_with_llm
        from atoms_plus.roles.vibe_coding_instructions import (
            generate_vibe_coding_instructions,
        )
        from atoms_plus.team_mode.nodes.base import get_llm_config

        # Step 1: User input
        user_input = '做一个简单的计数器，有增加和减少按钮'
        print(f'\n📝 User Input: {user_input}')

        # Step 2: Role detection
        detection = await detect_role_with_llm(user_input)
        print(f'🔍 Role: {detection.role_id}, Web App: {detection.is_web_app_task}')

        assert detection.is_web_app_task, 'Should be detected as web app task'
        assert detection.role_id == 'role-engineer'

        # Step 3: Generate instructions
        instructions = generate_vibe_coding_instructions(
            role_id=detection.role_id,
            is_web_app_task=detection.is_web_app_task,
        )
        print(f'📋 Instructions: {len(instructions)} chars')

        # Step 4: Simulate agent code generation
        llm_config = get_llm_config()

        system_prompt = f"""You are a frontend developer.

{instructions}

IMPORTANT: Output ONLY the code for App.tsx. No explanations."""

        print('⏳ Generating code with LLM...')

        response = await litellm.acompletion(
            model=llm_config['model'],
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_input},
            ],
            api_base=llm_config['api_base'],
            api_key=llm_config['api_key'],
            max_tokens=2000,
            temperature=0.7,
        )

        code = response.choices[0].message.content
        print(f'✅ Generated {len(code)} chars of code')

        # Step 5: Validate code quality
        quality_checks = self._validate_code_quality(code)

        passed = sum(quality_checks.values())
        total = len(quality_checks)
        print(f'\n📊 Code Quality: {passed}/{total} checks passed')

        for check, result in quality_checks.items():
            status = '✅' if result else '❌'
            print(f'   {status} {check}')

        assert passed >= total * 0.7, f'Code quality too low: {passed}/{total}'

    def _validate_code_quality(self, code: str) -> dict:
        """Validate generated code quality."""
        return {
            'Has React Import': 'react' in code.lower() or 'useState' in code,
            'Has useState Hook': 'useState' in code,
            'Has JSX Return': 'return' in code and '<' in code,
            'Has Tailwind Classes': 'className' in code,
            'Has Click Handler': 'onClick' in code or 'click' in code.lower(),
            'Has Function Component': bool(re.search(r'(function|const)\s+\w+', code)),
            'Has Export': 'export' in code,
            'No Markdown Wrapper': not code.strip().startswith('```'),
        }


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s', '--timeout=180'])
