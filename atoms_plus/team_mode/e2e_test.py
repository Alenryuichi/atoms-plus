#!/usr/bin/env python3
# Atoms Plus - Local Development CLI
"""
Local development CLI for Atoms Plus - deployment, testing, and diagnostics.

Usage:
    # One-command local deployment
    poetry run atoms start
    # or: atoms start (if installed globally)

    # Stop all services
    atoms stop

    # Restart services
    atoms restart

    # Check deployment status (default command)
    atoms status
    atoms

    # View logs
    atoms logs
    atoms logs --service backend -f

    # Full E2E test
    atoms test
    atoms test --task "Create a todo app"

Commands:
    start   - Start backend and frontend services
    stop    - Stop all running services
    restart - Restart all services
    status  - Quick deployment status check (default)
    logs    - View service logs
    test    - Run full E2E test

Environment:
    RUNTIME=local (ProcessSandboxService)
    OH_DISABLE_MCP=true
    Backend port: 3000
    Frontend port: 3002
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import signal
import subprocess
import sys
import time
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


async def check_health(host: str, port: int, quiet: bool = False) -> bool:
    """Check backend health."""
    import httpx

    url = f'http://{host}:{port}/atoms-plus/health'
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                if not quiet:
                    print(f'{Colors.GREEN}✓ Backend healthy:{Colors.RESET} {data}')
                return True
            else:
                if not quiet:
                    print(f'{Colors.RED}✗ Backend unhealthy: HTTP {response.status_code}{Colors.RESET}')
                return False
    except Exception as e:
        if not quiet:
            print(f'{Colors.RED}✗ Backend unreachable: {e}{Colors.RESET}')
        return False


async def check_deployment_status(host: str, port: int, frontend_port: int = 3002) -> dict:
    """
    Quick deployment status check.

    Returns dict with status of all services.
    """
    import httpx
    import subprocess

    status = {
        'backend': {'status': '❌', 'url': f'http://{host}:{port}', 'version': None, 'details': None},
        'frontend': {'status': '❌', 'url': f'http://{host}:{frontend_port}', 'details': None},
        'api_endpoints': {},
        'processes': [],
    }

    async with httpx.AsyncClient(timeout=5.0) as client:
        # Check backend
        try:
            resp = await client.get(f'http://{host}:{port}/atoms-plus')
            if resp.status_code == 200:
                data = resp.json()
                status['backend']['status'] = '✅'
                status['backend']['version'] = data.get('version', 'unknown')
                status['backend']['details'] = data.get('name', 'Atoms Plus')

                # Check each feature endpoint
                for feature in data.get('features', []):
                    path = feature.get('path', '')
                    name = feature.get('name', '')
                    try:
                        ep_resp = await client.get(f'http://{host}:{port}{path}')
                        status['api_endpoints'][name] = '✅' if ep_resp.status_code == 200 else f'⚠️ {ep_resp.status_code}'
                    except Exception:
                        status['api_endpoints'][name] = '❌'
        except Exception as e:
            status['backend']['details'] = str(e)

        # Check frontend
        try:
            resp = await client.get(f'http://{host}:{frontend_port}')
            if resp.status_code == 200:
                status['frontend']['status'] = '✅'
                status['frontend']['details'] = 'OpenHands Frontend'
        except Exception as e:
            status['frontend']['details'] = str(e)

    # Check processes
    try:
        result = subprocess.run(
            ['pgrep', '-fl', 'atoms_plus'],
            capture_output=True, text=True, timeout=5
        )
        if result.stdout.strip():
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split(' ', 1)
                    status['processes'].append({
                        'pid': parts[0],
                        'cmd': parts[1] if len(parts) > 1 else 'unknown'
                    })
    except Exception:
        pass

    return status


def print_deployment_status(status: dict) -> None:
    """Print formatted deployment status."""
    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}')
    print(f'{Colors.BOLD}  Atoms Plus 部署状态{Colors.RESET}')
    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}\n')

    # Services
    print(f'{Colors.BOLD}服务状态:{Colors.RESET}')
    backend = status['backend']
    version_str = f" (v{backend['version']})" if backend['version'] else ""
    print(f"  后端: {backend['status']} {backend['url']}{version_str}")

    frontend = status['frontend']
    print(f"  前端: {frontend['status']} {frontend['url']}")
    print()

    # API Endpoints
    if status['api_endpoints']:
        print(f'{Colors.BOLD}API 端点:{Colors.RESET}')
        for name, ep_status in status['api_endpoints'].items():
            print(f"  {name}: {ep_status}")
        print()

    # Processes
    if status['processes']:
        print(f'{Colors.BOLD}运行进程:{Colors.RESET}')
        for proc in status['processes']:
            print(f"  PID {proc['pid']}: {proc['cmd'][:60]}...")
        print()

    # Summary
    all_ok = (
        status['backend']['status'] == '✅' and
        status['frontend']['status'] == '✅'
    )
    if all_ok:
        print(f'{Colors.GREEN}{Colors.BOLD}✓ 所有服务正常运行{Colors.RESET}')
    else:
        print(f'{Colors.YELLOW}{Colors.BOLD}⚠ 部分服务异常{Colors.RESET}')
        if status['backend']['status'] != '✅':
            print(f'  → 启动后端: poetry run python -m atoms_plus.atoms_server')
        if status['frontend']['status'] != '✅':
            print(f'  → 启动前端: cd frontend && npm run dev')


async def run_status_check(host: str, port: int, frontend_port: int) -> int:
    """Run deployment status check."""
    status = await check_deployment_status(host, port, frontend_port)
    print_deployment_status(status)

    all_ok = (
        status['backend']['status'] == '✅' and
        status['frontend']['status'] == '✅'
    )
    return 0 if all_ok else 1


# ============================================================================
# LOCAL DEPLOYMENT MANAGEMENT
# ============================================================================

# Log file paths
LOG_DIR = Path('/tmp/atoms-plus-logs')
BACKEND_LOG = LOG_DIR / 'backend.log'
FRONTEND_LOG = LOG_DIR / 'frontend.log'
PID_FILE = LOG_DIR / 'pids.json'


def get_project_root() -> Path:
    """Get the project root directory."""
    # This file is at atoms_plus/team_mode/e2e_test.py
    return Path(__file__).parent.parent.parent


def check_cli_installed() -> tuple[bool, str]:
    """Check if atoms-plus-cli is installed.

    Returns:
        tuple: (is_installed, version_or_message)
    """
    try:
        result = subprocess.run(
            ['pip', 'show', 'atoms-plus-cli'],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            # Extract version
            for line in result.stdout.split('\n'):
                if line.startswith('Version:'):
                    return True, line.split(':', 1)[1].strip()
            return True, 'unknown'
        return False, 'not installed'
    except Exception as e:
        return False, str(e)


def show_install_hint() -> None:
    """Show installation hint for CLI."""
    print(f'{Colors.YELLOW}╭─────────────────────────────────────────────────────────╮{Colors.RESET}')
    print(f'{Colors.YELLOW}│ 💡 提示: atoms-plus-cli 未安装                          │{Colors.RESET}')
    print(f'{Colors.YELLOW}│                                                         │{Colors.RESET}')
    print(f'{Colors.YELLOW}│ 安装后可直接使用 "atoms" 命令:                          │{Colors.RESET}')
    print(f'{Colors.YELLOW}│   poetry run pip install -e atoms_plus/                 │{Colors.RESET}')
    print(f'{Colors.YELLOW}│                                                         │{Colors.RESET}')
    print(f'{Colors.YELLOW}│ 然后使用: poetry run atoms start                        │{Colors.RESET}')
    print(f'{Colors.YELLOW}╰─────────────────────────────────────────────────────────╯{Colors.RESET}')
    print()


def ensure_log_dir() -> None:
    """Ensure log directory exists."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)


def save_pids(backend_pid: int | None, frontend_pid: int | None) -> None:
    """Save process PIDs to file."""
    ensure_log_dir()
    pids = {'backend': backend_pid, 'frontend': frontend_pid, 'timestamp': time.time()}
    with open(PID_FILE, 'w') as f:
        json.dump(pids, f)


def load_pids() -> dict:
    """Load process PIDs from file."""
    if PID_FILE.exists():
        try:
            with open(PID_FILE) as f:
                return json.load(f)
        except Exception:
            pass
    return {'backend': None, 'frontend': None}


def is_port_in_use(port: int) -> bool:
    """Check if a port is in use."""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0


def kill_process_on_port(port: int) -> bool:
    """Kill process using a specific port."""
    try:
        result = subprocess.run(
            ['lsof', '-ti', f':{port}'],
            capture_output=True, text=True, timeout=5
        )
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                try:
                    os.kill(int(pid), signal.SIGTERM)
                except (ProcessLookupError, ValueError):
                    pass
            time.sleep(1)
            return True
    except Exception:
        pass
    return False


def start_backend(project_root: Path, port: int = 3000) -> subprocess.Popen | None:
    """Start the backend server."""
    ensure_log_dir()

    # Kill existing process on port
    if is_port_in_use(port):
        print(f'{Colors.YELLOW}  → 端口 {port} 已占用，正在关闭...{Colors.RESET}')
        kill_process_on_port(port)
        time.sleep(2)

    env = os.environ.copy()
    env.update({
        'RUNTIME': 'local',
        'SKIP_DEPENDENCY_CHECK': '1',
        'OH_DISABLE_MCP': 'true',
    })

    with open(BACKEND_LOG, 'w') as log_file:
        process = subprocess.Popen(
            ['poetry', 'run', 'python', '-m', 'atoms_plus.atoms_server'],
            cwd=project_root,
            env=env,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

    return process


def start_frontend(project_root: Path, port: int = 3002) -> subprocess.Popen | None:
    """Start the frontend dev server."""
    ensure_log_dir()

    frontend_dir = project_root / 'frontend'
    if not frontend_dir.exists():
        print(f'{Colors.RED}  ✗ frontend 目录不存在{Colors.RESET}')
        return None

    # Kill existing process on port
    if is_port_in_use(port):
        print(f'{Colors.YELLOW}  → 端口 {port} 已占用，正在关闭...{Colors.RESET}')
        kill_process_on_port(port)
        time.sleep(2)

    env = os.environ.copy()
    env['VITE_FRONTEND_PORT'] = str(port)

    with open(FRONTEND_LOG, 'w') as log_file:
        process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd=frontend_dir,
            env=env,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

    return process


async def wait_for_service(url: str, timeout: int = 60) -> bool:
    """Wait for a service to become available."""
    import httpx

    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return True
        except Exception:
            pass
        await asyncio.sleep(2)
    return False


async def run_start(
    backend_port: int,
    frontend_port: int,
    backend_only: bool = False,
    frontend_only: bool = False,
) -> int:
    """Start backend and/or frontend services."""
    # Determine what to start
    start_backend_flag = not frontend_only
    start_frontend_flag = not backend_only

    service_name = '后端' if backend_only else ('前端' if frontend_only else '后端 + 前端')

    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}')
    print(f'{Colors.BOLD}  Atoms Plus 本地部署 ({service_name}){Colors.RESET}')
    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}\n')

    project_root = get_project_root()
    print(f'{Colors.CYAN}项目目录:{Colors.RESET} {project_root}\n')

    # Load existing PIDs
    existing_pids = load_pids()
    backend_pid = existing_pids.get('backend')
    frontend_pid = existing_pids.get('frontend')

    step = 0
    total_steps = int(start_backend_flag) + int(start_frontend_flag)

    # Start backend
    if start_backend_flag:
        step += 1
        print(f'{Colors.BOLD}[{step}/{total_steps}] 启动后端服务...{Colors.RESET}')
        backend_proc = start_backend(project_root, backend_port)
        if backend_proc:
            print(f'{Colors.GREEN}  ✓ 后端进程已启动 (PID: {backend_proc.pid}){Colors.RESET}')
            backend_pid = backend_proc.pid
        else:
            print(f'{Colors.RED}  ✗ 后端启动失败{Colors.RESET}')
            return 1

    # Start frontend
    if start_frontend_flag:
        step += 1
        print(f'{Colors.BOLD}[{step}/{total_steps}] 启动前端服务...{Colors.RESET}')
        frontend_proc = start_frontend(project_root, frontend_port)
        if frontend_proc:
            print(f'{Colors.GREEN}  ✓ 前端进程已启动 (PID: {frontend_proc.pid}){Colors.RESET}')
            frontend_pid = frontend_proc.pid
        else:
            print(f'{Colors.RED}  ✗ 前端启动失败{Colors.RESET}')
            # Still save backend PID if we started it
            if start_backend_flag:
                save_pids(backend_pid, None)
            return 1

    # Save PIDs
    save_pids(backend_pid, frontend_pid)

    # Wait for services
    print(f'\n{Colors.CYAN}等待服务就绪...{Colors.RESET}')

    backend_ready = True
    frontend_ready = True

    if start_backend_flag:
        backend_ready = await wait_for_service(f'http://localhost:{backend_port}/atoms-plus', timeout=30)
        if backend_ready:
            print(f'{Colors.GREEN}  ✓ 后端就绪{Colors.RESET}')
        else:
            print(f'{Colors.YELLOW}  ⚠ 后端未响应 (可能仍在启动中){Colors.RESET}')

    if start_frontend_flag:
        frontend_ready = await wait_for_service(f'http://localhost:{frontend_port}/', timeout=30)
        if frontend_ready:
            print(f'{Colors.GREEN}  ✓ 前端就绪{Colors.RESET}')
        else:
            print(f'{Colors.YELLOW}  ⚠ 前端未响应 (可能仍在启动中){Colors.RESET}')

    # Summary
    print(f'\n{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}')
    all_ready = (not start_backend_flag or backend_ready) and (not start_frontend_flag or frontend_ready)
    if all_ready:
        print(f'{Colors.GREEN}{Colors.BOLD}✓ 部署完成！{Colors.RESET}')
    else:
        print(f'{Colors.YELLOW}{Colors.BOLD}⚠ 部署完成 (部分服务仍在启动){Colors.RESET}')

    print(f'\n{Colors.BOLD}访问地址:{Colors.RESET}')
    if start_frontend_flag:
        print(f'  前端: {Colors.CYAN}http://localhost:{frontend_port}{Colors.RESET}')
    if start_backend_flag:
        print(f'  后端: {Colors.CYAN}http://localhost:{backend_port}/atoms-plus{Colors.RESET}')
    print(f'\n{Colors.BOLD}日志文件:{Colors.RESET}')
    if start_backend_flag:
        print(f'  后端: {BACKEND_LOG}')
    if start_frontend_flag:
        print(f'  前端: {FRONTEND_LOG}')
    print(f'\n{Colors.BOLD}停止服务:{Colors.RESET}')
    print(f'  atoms stop')

    return 0


def run_stop(backend_only: bool = False, frontend_only: bool = False) -> int:
    """Stop backend and/or frontend services."""
    # Determine what to stop
    stop_backend = not frontend_only
    stop_frontend = not backend_only

    service_name = '后端' if backend_only else ('前端' if frontend_only else '所有服务')

    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}')
    print(f'{Colors.BOLD}  停止 Atoms Plus 服务 ({service_name}){Colors.RESET}')
    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}\n')

    stopped = 0

    # Load existing PIDs
    pids = load_pids()
    new_backend_pid = pids.get('backend')
    new_frontend_pid = pids.get('frontend')

    # Kill by PID file
    services_to_stop = []
    if stop_backend:
        services_to_stop.append(('后端', pids.get('backend'), 3000))
    if stop_frontend:
        services_to_stop.append(('前端', pids.get('frontend'), 3002))

    for name, pid, port in services_to_stop:
        if pid:
            try:
                os.kill(pid, signal.SIGTERM)
                print(f'{Colors.GREEN}  ✓ {name} (PID {pid}) 已停止{Colors.RESET}')
                stopped += 1
                # Clear PID
                if name == '后端':
                    new_backend_pid = None
                else:
                    new_frontend_pid = None
            except ProcessLookupError:
                print(f'{Colors.YELLOW}  ⚠ {name} (PID {pid}) 已不存在{Colors.RESET}')
                if name == '后端':
                    new_backend_pid = None
                else:
                    new_frontend_pid = None
            except Exception as e:
                print(f'{Colors.RED}  ✗ 停止 {name} 失败: {e}{Colors.RESET}')

        # Also kill by port (fallback)
        if is_port_in_use(port):
            if kill_process_on_port(port):
                print(f'{Colors.GREEN}  ✓ 端口 {port} ({name}) 已释放{Colors.RESET}')
                stopped += 1

    # Kill any remaining atoms_plus processes (only if stopping backend)
    if stop_backend:
        try:
            result = subprocess.run(
                ['pkill', '-f', 'atoms_plus.atoms_server'],
                capture_output=True, timeout=5
            )
            if result.returncode == 0:
                print(f'{Colors.GREEN}  ✓ atoms_server 进程已清理{Colors.RESET}')
        except Exception:
            pass

    # Update PID file (don't delete if only stopping one service)
    if backend_only or frontend_only:
        save_pids(new_backend_pid, new_frontend_pid)
    else:
        # Clean up PID file completely
        if PID_FILE.exists():
            PID_FILE.unlink()

    if stopped > 0:
        print(f'\n{Colors.GREEN}{Colors.BOLD}✓ 服务已停止{Colors.RESET}')
    else:
        print(f'\n{Colors.YELLOW}{Colors.BOLD}⚠ 没有运行中的服务{Colors.RESET}')

    return 0


async def run_restart(
    backend_port: int,
    frontend_port: int,
    backend_only: bool = False,
    frontend_only: bool = False,
) -> int:
    """Restart backend and/or frontend services."""
    service_name = '后端' if backend_only else ('前端' if frontend_only else '所有服务')

    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}')
    print(f'{Colors.BOLD}  重启 Atoms Plus 服务 ({service_name}){Colors.RESET}')
    print(f'{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.RESET}\n')

    print(f'{Colors.CYAN}[1/2] 停止现有服务...{Colors.RESET}')
    run_stop(backend_only=backend_only, frontend_only=frontend_only)

    print(f'\n{Colors.CYAN}[2/2] 启动服务...{Colors.RESET}\n')
    time.sleep(2)

    return await run_start(
        backend_port, frontend_port,
        backend_only=backend_only, frontend_only=frontend_only
    )


def run_logs(service: str, lines: int, follow: bool) -> int:
    """View service logs."""
    log_file = None

    if service == 'backend':
        log_file = BACKEND_LOG
    elif service == 'frontend':
        log_file = FRONTEND_LOG
    elif service == 'all':
        # Show both
        print(f'{Colors.BOLD}═══ 后端日志 ({BACKEND_LOG}) ═══{Colors.RESET}')
        if BACKEND_LOG.exists():
            subprocess.run(['tail', f'-{lines}', str(BACKEND_LOG)])
        else:
            print(f'{Colors.YELLOW}  日志文件不存在{Colors.RESET}')

        print(f'\n{Colors.BOLD}═══ 前端日志 ({FRONTEND_LOG}) ═══{Colors.RESET}')
        if FRONTEND_LOG.exists():
            subprocess.run(['tail', f'-{lines}', str(FRONTEND_LOG)])
        else:
            print(f'{Colors.YELLOW}  日志文件不存在{Colors.RESET}')
        return 0
    else:
        print(f'{Colors.RED}未知服务: {service}{Colors.RESET}')
        return 1

    if not log_file.exists():
        print(f'{Colors.YELLOW}日志文件不存在: {log_file}{Colors.RESET}')
        return 1

    if follow:
        print(f'{Colors.CYAN}实时跟踪 {log_file} (Ctrl+C 退出){Colors.RESET}\n')
        try:
            subprocess.run(['tail', '-f', str(log_file)])
        except KeyboardInterrupt:
            print(f'\n{Colors.CYAN}已停止跟踪{Colors.RESET}')
    else:
        subprocess.run(['tail', f'-{lines}', str(log_file)])

    return 0


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
        description='Atoms Plus 本地开发 CLI - 部署、测试、诊断',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # 一键启动本地部署
  atoms start

  # 停止所有服务
  atoms stop

  # 重启服务
  atoms restart

  # 检查部署状态 (默认命令)
  atoms status
  atoms

  # 查看日志
  atoms logs
  atoms logs --service backend -f

  # E2E 测试
  atoms test --task "Create a todo app"

Note: Use "poetry run atoms" if not installed globally.
        ''',
    )

    # Common arguments
    parser.add_argument('--host', default='localhost', help='Backend host (default: localhost)')
    parser.add_argument('--port', type=int, default=3000, help='Backend port (default: 3000)')
    parser.add_argument('--frontend-port', type=int, default=3002, help='Frontend port (default: 3002)')

    # Subcommands
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Start command
    start_parser = subparsers.add_parser('start', help='Start backend and frontend services')
    start_parser.add_argument(
        '--backend-only', '-b', action='store_true',
        help='Start only the backend server'
    )
    start_parser.add_argument(
        '--frontend-only', '-f', action='store_true',
        help='Start only the frontend server'
    )

    # Stop command
    stop_parser = subparsers.add_parser('stop', help='Stop all running services')
    stop_parser.add_argument(
        '--backend-only', '-b', action='store_true',
        help='Stop only the backend server'
    )
    stop_parser.add_argument(
        '--frontend-only', '-f', action='store_true',
        help='Stop only the frontend server'
    )

    # Restart command
    restart_parser = subparsers.add_parser('restart', help='Restart all services')
    restart_parser.add_argument(
        '--backend-only', '-b', action='store_true',
        help='Restart only the backend server'
    )
    restart_parser.add_argument(
        '--frontend-only', '-f', action='store_true',
        help='Restart only the frontend server'
    )

    # Status command
    status_parser = subparsers.add_parser('status', help='Quick deployment status check')
    status_parser.add_argument('-q', '--quiet', action='store_true', help='Minimal output')

    # Logs command
    logs_parser = subparsers.add_parser('logs', help='View service logs')
    logs_parser.add_argument(
        '--service', '-s', default='all',
        choices=['all', 'backend', 'frontend'],
        help='Which service logs to show (default: all)'
    )
    logs_parser.add_argument(
        '--lines', '-n', type=int, default=50,
        help='Number of lines to show (default: 50)'
    )
    logs_parser.add_argument(
        '--follow', '-f', action='store_true',
        help='Follow log output in real-time'
    )

    # Test command
    test_parser = subparsers.add_parser('test', help='Run full E2E test')
    test_parser.add_argument(
        '--task',
        default='创建一个简单的 Python Hello World 脚本，打印 "Hello, World!"',
        help='Task description for Team Mode',
    )
    test_parser.add_argument('--model', default=default_model, help=f'LLM model (default: {default_model})')
    test_parser.add_argument(
        '--skip-clarification', action='store_true', default=True,
        help='Auto-skip HITL clarification (default: True)',
    )
    test_parser.add_argument('--timeout', type=int, default=300, help='WebSocket timeout in seconds (default: 300)')
    test_parser.add_argument('-v', '--verbose', action='store_true', help='Verbose output')

    args = parser.parse_args()

    # Default to 'status' if no command specified (quick check)
    if args.command is None:
        args.command = 'status'

    # Route to appropriate handler
    if args.command == 'start':
        backend_only = getattr(args, 'backend_only', False)
        frontend_only = getattr(args, 'frontend_only', False)
        return asyncio.run(run_start(
            args.port, args.frontend_port,
            backend_only=backend_only, frontend_only=frontend_only
        ))
    elif args.command == 'stop':
        backend_only = getattr(args, 'backend_only', False)
        frontend_only = getattr(args, 'frontend_only', False)
        return run_stop(backend_only=backend_only, frontend_only=frontend_only)
    elif args.command == 'restart':
        backend_only = getattr(args, 'backend_only', False)
        frontend_only = getattr(args, 'frontend_only', False)
        return asyncio.run(run_restart(
            args.port, args.frontend_port,
            backend_only=backend_only, frontend_only=frontend_only
        ))
    elif args.command == 'status':
        # Check CLI installation status
        cli_installed, cli_version = check_cli_installed()
        if not cli_installed:
            show_install_hint()
        return asyncio.run(run_status_check(args.host, args.port, args.frontend_port))
    elif args.command == 'logs':
        return run_logs(args.service, args.lines, args.follow)
    elif args.command == 'test':
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
    else:
        parser.print_help()
        return 1


if __name__ == '__main__':
    sys.exit(main())

