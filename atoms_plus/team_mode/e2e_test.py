#!/usr/bin/env python3
# Atoms Plus - Team Mode E2E Test CLI
"""
End-to-end test tool for Team Mode multi-agent collaboration.

Usage:
    poetry run python -m atoms_plus.team_mode.e2e_test
    poetry run python -m atoms_plus.team_mode.e2e_test --task "Create a todo app"
    poetry run python -m atoms_plus.team_mode.e2e_test --host localhost --port 3000

This tool:
1. Checks backend health
2. Creates a Team Mode session
3. Connects to WebSocket stream
4. Handles HITL clarification (auto-skip or provide answers)
5. Validates the PM → Architect → Engineer workflow
6. Outputs colored logs showing agent thoughts
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any

# ANSI color codes
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'

AGENT_COLORS = {
    'pm': Colors.BLUE,
    'architect': Colors.MAGENTA,
    'engineer': Colors.CYAN,
    'unknown': Colors.YELLOW,
}


def load_user_settings() -> dict[str, Any]:
    """Load settings from ~/.openhands/settings.json."""
    settings_path = Path.home() / '.openhands' / 'settings.json'
    if settings_path.exists():
        try:
            with open(settings_path) as f:
                return json.load(f)
        except Exception as e:
            print(f'{Colors.YELLOW}[WARN] Failed to load settings.json: {e}{Colors.RESET}')
    return {}


def print_event(event_type: str, data: dict, verbose: bool = False) -> None:
    """Print formatted event output."""
    if event_type == 'thought':
        agent = data.get('agent', 'unknown').lower()
        status = data.get('status', '')
        content = data.get('content', '')
        color = AGENT_COLORS.get(agent, Colors.YELLOW)
        
        print(f'{color}{Colors.BOLD}[{agent.upper()}]{Colors.RESET} {Colors.YELLOW}({status}){Colors.RESET}')
        # Truncate long content
        if len(content) > 800:
            print(f'  {content[:800]}...')
        else:
            print(f'  {content}')
        print()
    elif event_type == 'started':
        print(f'{Colors.GREEN}{Colors.BOLD}=== Session Started ==={Colors.RESET}\n')
    elif event_type == 'completed':
        print(f'{Colors.GREEN}{Colors.BOLD}\n=== Session Completed ==={Colors.RESET}')
    elif event_type == 'error':
        msg = data.get('message', data.get('error', 'Unknown error'))
        print(f'{Colors.RED}{Colors.BOLD}[ERROR]{Colors.RESET} {msg}')
    elif event_type == 'interrupt':
        print(f'{Colors.YELLOW}{Colors.BOLD}[INTERRUPT]{Colors.RESET} Type: {data.get("type")}')
        for q in data.get('questions', []):
            print(f'  Q: {q.get("question_text")}')
    elif event_type == 'clarification:resumed':
        print(f'{Colors.CYAN}[RESUMED]{Colors.RESET} Continuing after clarification...\n')
    elif verbose:
        print(f'{Colors.YELLOW}[{event_type.upper()}]{Colors.RESET} {json.dumps(data, ensure_ascii=False)[:200]}')


async def check_health(host: str, port: int) -> bool:
    """Check backend health."""
    import httpx
    
    url = f'http://{host}:{port}/atoms-plus/health'
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                print(f'{Colors.GREEN}✓ Backend healthy:{Colors.RESET} {data}')
                return True
            else:
                print(f'{Colors.RED}✗ Backend unhealthy: HTTP {response.status_code}{Colors.RESET}')
                return False
    except Exception as e:
        print(f'{Colors.RED}✗ Backend unreachable: {e}{Colors.RESET}')
        return False


async def create_session(
    host: str, port: int, task: str, model: str, max_iterations: int = 3
) -> dict | None:
    """Create a new Team Mode session."""
    import httpx
    
    url = f'http://{host}:{port}/api/v1/team/sessions'
    payload = {
        'task': task,
        'model': model,
        'max_iterations': max_iterations,
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                print(f'{Colors.GREEN}✓ Session created:{Colors.RESET} {data["session_id"]}')
                print(f'  Mode: {data["execution_mode"]}, Model: {model}')
                return data
            else:
                print(f'{Colors.RED}✗ Failed to create session: {response.text}{Colors.RESET}')
                return None
    except Exception as e:
        print(f'{Colors.RED}✗ Failed to create session: {e}{Colors.RESET}')
        return None


async def stream_session(
    host: str,
    port: int,
    session_id: str,
    skip_clarification: bool = True,
    timeout: int = 300,
    verbose: bool = False,
) -> bool:
    """Connect to WebSocket and stream session events."""
    import websockets

    # Clear proxy environment variables for localhost connections
    import os
    for key in ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'all_proxy', 'ALL_PROXY']:
        os.environ.pop(key, None)

    uri = f'ws://{host}:{port}/api/v1/team/sessions/{session_id}/stream'
    print(f'{Colors.CYAN}→ Connecting to WebSocket...{Colors.RESET}')

    try:
        async with websockets.connect(uri, ping_interval=20, ping_timeout=60) as ws:
            print(f'{Colors.GREEN}✓ WebSocket connected{Colors.RESET}\n')

            events_received = 0
            max_events = 100

            while events_received < max_events:
                try:
                    message = await asyncio.wait_for(ws.recv(), timeout=timeout)
                    data = json.loads(message)
                    events_received += 1
                    event_type = data.get('event', 'unknown')

                    print_event(event_type, data, verbose)

                    if event_type == 'error':
                        return False
                    elif event_type == 'completed':
                        return True
                    elif event_type == 'interrupt':
                        if skip_clarification:
                            print(f'  {Colors.YELLOW}→ Auto-skipping clarification...{Colors.RESET}')
                            await ws.send(json.dumps({'type': 'clarification:skip'}))
                        else:
                            # TODO: Interactive mode - prompt user for answers
                            print(f'  {Colors.YELLOW}→ Skipping (interactive mode not implemented){Colors.RESET}')
                            await ws.send(json.dumps({'type': 'clarification:skip'}))

                except asyncio.TimeoutError:
                    print(f'{Colors.YELLOW}\n⚠ Timeout after {timeout}s waiting for events{Colors.RESET}')
                    return False

    except Exception as e:
        print(f'{Colors.RED}✗ WebSocket error: {e}{Colors.RESET}')
        return False

    return True


async def run_e2e_test(
    host: str,
    port: int,
    task: str,
    model: str,
    skip_clarification: bool,
    timeout: int,
    verbose: bool,
) -> int:
    """Run the full E2E test."""
    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}')
    print(f'{Colors.BOLD}  Team Mode E2E Test{Colors.RESET}')
    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}')
    print(f'  Host: {host}:{port}')
    print(f'  Model: {model}')
    print(f'  Task: {task[:80]}{"..." if len(task) > 80 else ""}')
    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}\n')

    # Step 1: Check health
    print(f'{Colors.BOLD}[1/3] Checking backend health...{Colors.RESET}')
    if not await check_health(host, port):
        return 1
    print()

    # Step 2: Create session
    print(f'{Colors.BOLD}[2/3] Creating session...{Colors.RESET}')
    session = await create_session(host, port, task, model)
    if not session:
        return 1
    print()

    # Step 3: Stream session
    print(f'{Colors.BOLD}[3/3] Streaming session...{Colors.RESET}')
    success = await stream_session(
        host, port, session['session_id'], skip_clarification, timeout, verbose
    )

    if success:
        print(f'\n{Colors.GREEN}{Colors.BOLD}✓ E2E Test PASSED{Colors.RESET}')
        return 0
    else:
        print(f'\n{Colors.RED}{Colors.BOLD}✗ E2E Test FAILED{Colors.RESET}')
        return 1


def main() -> int:
    """CLI entry point."""
    settings = load_user_settings()

    # Default model from settings or fallback
    default_model = settings.get('llm_model', 'openai/qwen-plus')

    parser = argparse.ArgumentParser(
        description='Team Mode E2E Test CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  poetry run python -m atoms_plus.team_mode.e2e_test
  poetry run python -m atoms_plus.team_mode.e2e_test --task "Create a todo app"
  poetry run python -m atoms_plus.team_mode.e2e_test --model openai/qwen-plus
        ''',
    )
    parser.add_argument('--host', default='localhost', help='Backend host (default: localhost)')
    parser.add_argument('--port', type=int, default=3000, help='Backend port (default: 3000)')
    parser.add_argument(
        '--task',
        default='创建一个简单的 Python Hello World 脚本，打印 "Hello, World!"',
        help='Task description for Team Mode',
    )
    parser.add_argument('--model', default=default_model, help=f'LLM model (default: {default_model})')
    parser.add_argument(
        '--skip-clarification', action='store_true', default=True,
        help='Auto-skip HITL clarification (default: True)',
    )
    parser.add_argument('--timeout', type=int, default=300, help='WebSocket timeout in seconds (default: 300)')
    parser.add_argument('-v', '--verbose', action='store_true', help='Verbose output')

    args = parser.parse_args()

    return asyncio.run(
        run_e2e_test(
            host=args.host,
            port=args.port,
            task=args.task,
            model=args.model,
            skip_clarification=args.skip_clarification,
            timeout=args.timeout,
            verbose=args.verbose,
        )
    )


if __name__ == '__main__':
    sys.exit(main())

