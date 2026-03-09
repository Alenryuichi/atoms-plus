#!/usr/bin/env python3
"""
Quick test script for project graph generation.

Run with:
    PYTHONPATH=".:$PYTHONPATH" poetry run python atoms_plus/project_graph/test_generator.py
"""

import asyncio
import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))


async def test_project_graph():
    """Test project graph generation with various inputs."""
    from atoms_plus.project_graph import generate_project_graph

    test_cases = [
        '做一个番茄钟应用，有开始、暂停、重置功能',
        'Build a todo list with drag and drop',
        '电商网站，有商品列表、购物车、结算页面',
        'A blog with markdown support and dark mode',
    ]

    print('=' * 60)
    print('Project Graph Generator Test')
    print('=' * 60)

    for i, user_input in enumerate(test_cases, 1):
        print(f'\n📝 Test {i}: {user_input}')
        print('-' * 40)

        try:
            graph = await generate_project_graph(user_input)

            if graph:
                print(f'✅ Generated: {graph.name}')
                print(f'   Description: {graph.description}')
                print(f'   Tech Stack: {graph.tech_stack.framework} + {graph.tech_stack.language}')
                print(f'   Entities: {len(graph.entities)}')
                for e in graph.entities:
                    print(f'     - [{e.type.value}] {e.name}: {e.description}')
                print(f'   Relations: {len(graph.relations)}')
                print(f'   Features: {graph.features}')
                print('\n📊 Prompt Context:')
                print(graph.to_prompt_context())
            else:
                print('❌ Failed to generate graph')

        except Exception as e:
            print(f'❌ Error: {e}')

    print('\n' + '=' * 60)
    print('Test Complete')
    print('=' * 60)


async def test_vibe_coding_with_graph():
    """Test Vibe Coding instructions with project graph."""
    from atoms_plus.project_graph import generate_project_graph
    from atoms_plus.roles.vibe_coding_instructions import generate_vibe_coding_instructions

    user_input = '做一个天气应用，显示当前天气和未来7天预报'

    print('\n' + '=' * 60)
    print('Vibe Coding + Project Graph Integration Test')
    print('=' * 60)
    print(f'\n📝 Input: {user_input}')

    # Generate project graph
    graph = await generate_project_graph(user_input)

    if graph:
        print(f'\n✅ Graph: {graph.name} ({len(graph.entities)} entities)')

        # Generate instructions with graph
        instructions = generate_vibe_coding_instructions(
            role_id='role-engineer',
            is_web_app_task=True,
            project_graph=graph,
        )

        print(f'\n📋 Instructions ({len(instructions)} chars):')
        print('-' * 40)
        # Print first 2000 chars
        print(instructions[:2000])
        if len(instructions) > 2000:
            print(f'\n... [{len(instructions) - 2000} more chars]')
    else:
        print('❌ Failed to generate graph')


if __name__ == '__main__':
    # Check for LLM API key
    api_key = os.environ.get('LLM_API_KEY')
    if not api_key:
        print('⚠️  Warning: LLM_API_KEY not set')
        print('   Set it with: export LLM_API_KEY=your-key')
        sys.exit(1)

    # Run tests
    asyncio.run(test_project_graph())
    asyncio.run(test_vibe_coding_with_graph())

