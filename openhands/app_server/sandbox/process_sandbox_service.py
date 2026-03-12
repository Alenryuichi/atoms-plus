"""Process-based sandbox service implementation.

This service creates sandboxes by spawning separate agent server processes,
each running within a dedicated directory.
"""

import asyncio
import logging
import os
import socket
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from typing import AsyncGenerator

import base62
import httpx
import psutil
from fastapi import Request
from pydantic import BaseModel, ConfigDict, Field

from openhands.agent_server.utils import utc_now
from openhands.app_server.errors import SandboxError
from openhands.app_server.sandbox.sandbox_models import (
    AGENT_SERVER,
    WORKER_1,
    WORKER_2,
    WORKER_3,
    WORKER_4,
    WORKER_5,
    WORKER_6,
    WORKER_7,
    WORKER_8,
    WORKER_9,
    WORKER_10,
    WORKER_11,
    WORKER_12,
    WORKER_13,
    WORKER_14,
    WORKER_15,
    WORKER_16,
    WORKER_17,
    WORKER_18,
    WORKER_19,
    WORKER_20,
    ExposedUrl,
    SandboxInfo,
    SandboxPage,
    SandboxStatus,
)
from openhands.app_server.sandbox.sandbox_service import (
    SandboxService,
    SandboxServiceInjector,
)
from openhands.app_server.sandbox.sandbox_spec_models import SandboxSpecInfo
from openhands.app_server.sandbox.sandbox_spec_service import SandboxSpecService
from openhands.app_server.services.injector import InjectorState

_logger = logging.getLogger(__name__)

WORKER_PORT_NAMES = [
    WORKER_1,
    WORKER_2,
    WORKER_3,
    WORKER_4,
    WORKER_5,
    WORKER_6,
    WORKER_7,
    WORKER_8,
    WORKER_9,
    WORKER_10,
    WORKER_11,
    WORKER_12,
    WORKER_13,
    WORKER_14,
    WORKER_15,
    WORKER_16,
    WORKER_17,
    WORKER_18,
    WORKER_19,
    WORKER_20,
]


class ProcessInfo(BaseModel):
    """Information about a running process."""

    pid: int
    port: int
    user_id: str | None
    working_dir: str
    session_api_key: str
    created_at: datetime
    sandbox_spec_id: str
    worker_ports: dict[str, int]

    model_config = ConfigDict(frozen=True)


# Global store
_processes: dict[str, ProcessInfo] = {}
_reserved_ports: set[int] = set()
_port_allocation_lock = asyncio.Lock()

# Pre-warmed sandbox pool for instant allocation
# Each entry is (sandbox_id, ProcessInfo) ready to be assigned
_warm_pool: list[tuple[str, ProcessInfo]] = []
_pool_lock = asyncio.Lock()
_pool_replenish_inflight = 0

# Pool configuration (can be overridden via environment variables)
POOL_SIZE = int(os.getenv('OH_SANDBOX_POOL_SIZE', '1'))
POOL_ENABLED = os.getenv('OH_SANDBOX_POOL_ENABLED', 'true').lower() == 'true'

_logger.info(f'Agent Pool config: enabled={POOL_ENABLED}, size={POOL_SIZE}')


@dataclass
class ProcessSandboxService(SandboxService):
    """Sandbox service that spawns separate agent server processes.

    Each sandbox is implemented as a separate Python process running the
    action execution server, with each process:
    - Operating in a dedicated directory
    - Listening on a unique port
    - Having its own session API key
    """

    user_id: str | None
    sandbox_spec_service: SandboxSpecService
    base_working_dir: str
    base_port: int
    python_executable: str
    agent_server_module: str
    health_check_path: str
    httpx_client: httpx.AsyncClient
    exposed_url_pattern: str = 'http://localhost:{port}'

    def __post_init__(self):
        """Initialize the service after dataclass creation."""
        # Ensure base working directory exists
        os.makedirs(self.base_working_dir, exist_ok=True)

    def _find_unused_port(self, excluded_ports: set[int] | None = None) -> int:
        """Find an unused port starting from base_port."""
        reserved_ports = excluded_ports or set()
        port = self.base_port
        while port < self.base_port + 10000:  # Try up to 10000 ports
            if port in reserved_ports:
                port += 1
                continue
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('', port))
                    return port
            except OSError:
                port += 1
        raise SandboxError('No available ports found')

    def _collect_reserved_ports(self) -> set[int]:
        """Collect ports reserved by running and pre-warmed sandboxes."""
        reserved_ports = set(_reserved_ports)
        for process_info in _processes.values():
            reserved_ports.add(process_info.port)
            reserved_ports.update(process_info.worker_ports.values())
        for _, process_info in _warm_pool:
            reserved_ports.add(process_info.port)
            reserved_ports.update(process_info.worker_ports.values())
        return reserved_ports

    def _allocate_worker_ports(self, excluded_ports: set[int]) -> dict[str, int]:
        """Allocate a sandbox-specific set of worker ports."""
        worker_ports: dict[str, int] = {}
        reserved_ports = set(excluded_ports)
        for worker_name in WORKER_PORT_NAMES:
            worker_port = self._find_unused_port(reserved_ports)
            worker_ports[worker_name] = worker_port
            reserved_ports.add(worker_port)
        return worker_ports

    async def _reserve_process_ports(self) -> tuple[int, dict[str, int]]:
        """Reserve one agent port plus worker ports for a sandbox."""
        async with _port_allocation_lock:
            reserved_ports = self._collect_reserved_ports()
            agent_port = self._find_unused_port(reserved_ports)
            reserved_ports.add(agent_port)
            worker_ports = self._allocate_worker_ports(reserved_ports)
            _reserved_ports.update({agent_port, *worker_ports.values()})
            return agent_port, worker_ports

    async def _release_port_numbers(self, ports: set[int]) -> None:
        """Release port reservations after sandbox teardown or startup failure."""
        async with _port_allocation_lock:
            _reserved_ports.difference_update(ports)

    def _copy_openhands_directory(self, sandbox_dir: str) -> None:
        """Copy .openhands directory from project root to sandbox.

        This enables the agent server to load project-specific microagents/skills
        from the sandbox directory, following OpenHands' native design where
        skills are loaded from the working directory's .openhands/microagents/.

        The source directory is determined by:
        1. OH_PROJECT_ROOT environment variable (if set)
        2. Current working directory (fallback)
        """
        import shutil

        # Determine source project root
        project_root = os.getenv('OH_PROJECT_ROOT', os.getcwd())
        source_openhands = os.path.join(project_root, '.openhands')

        if not os.path.isdir(source_openhands):
            _logger.debug(
                f'No .openhands directory found at {source_openhands}, '
                'skipping microagents copy'
            )
            return

        dest_openhands = os.path.join(sandbox_dir, '.openhands')

        # Skip if already exists (e.g., sandbox reuse)
        if os.path.exists(dest_openhands):
            _logger.debug(
                f'.openhands directory already exists in sandbox at {dest_openhands}'
            )
            return

        try:
            shutil.copytree(source_openhands, dest_openhands)
            _logger.info(
                f'Copied .openhands directory to sandbox: '
                f'{source_openhands} -> {dest_openhands}'
            )
        except Exception as e:
            _logger.warning(f'Failed to copy .openhands directory to sandbox: {e}')

    def _create_sandbox_directory(self, sandbox_id: str) -> str:
        """Create a dedicated directory for the sandbox and initialize git.

        This ensures each sandbox has:
        1. A dedicated working directory for file isolation
        2. A git repository initialized for the 'Changes' tab to work
        3. Project microagents copied for skill loading
        """
        sandbox_dir = os.path.join(self.base_working_dir, sandbox_id)
        os.makedirs(sandbox_dir, exist_ok=True)

        # Copy .openhands directory from project root if it exists
        # This allows the agent server to load project-specific microagents/skills
        self._copy_openhands_directory(sandbox_dir)

        # Initialize git repository if git is available
        # This is required for the frontend "Changes" tab to work
        git_dir = os.path.join(sandbox_dir, '.git')
        if not os.path.exists(git_dir):
            try:
                result = subprocess.run(
                    ['git', 'init'],
                    cwd=sandbox_dir,
                    capture_output=True,
                    text=True,
                    timeout=10,
                )
                if result.returncode == 0:
                    _logger.info(f'Initialized git repository in {sandbox_dir}')
                    # Configure git user for commits
                    subprocess.run(
                        ['git', 'config', 'user.email', 'agent@openhands.ai'],
                        cwd=sandbox_dir,
                        capture_output=True,
                        timeout=5,
                    )
                    subprocess.run(
                        ['git', 'config', 'user.name', 'OpenHands Agent'],
                        cwd=sandbox_dir,
                        capture_output=True,
                        timeout=5,
                    )
                else:
                    _logger.warning(
                        f'git init failed in {sandbox_dir}: {result.stderr}'
                    )
            except FileNotFoundError:
                _logger.warning(
                    'git command not found - Changes tab may not work. '
                    'Install git in the container to enable this feature.'
                )
            except subprocess.TimeoutExpired:
                _logger.warning(f'git init timed out in {sandbox_dir}')
            except Exception as e:
                _logger.warning(f'Failed to initialize git in {sandbox_dir}: {e}')

        return sandbox_dir

    async def _start_agent_process(
        self,
        sandbox_id: str,
        port: int,
        working_dir: str,
        session_api_key: str,
        sandbox_spec: SandboxSpecInfo,
        worker_ports: dict[str, int],
    ) -> subprocess.Popen:
        """Start the agent server process."""
        # Prepare environment variables
        env = os.environ.copy()
        env.update(sandbox_spec.initial_env)
        env['SESSION_API_KEY'] = session_api_key

        # Set working directory environment variables for agent server
        # IMPORTANT: Conversations and bash events are stored OUTSIDE the working directory
        # to prevent them from appearing in the 'Changes' tab (git diff).
        # The working directory should only contain user project files.
        persistence_base = os.getenv('OH_PERSISTENCE_DIR', '/tmp/openhands-data')
        env['OH_CONVERSATIONS_PATH'] = os.path.join(
            persistence_base, sandbox_id, 'conversations'
        )
        env['OH_BASH_EVENTS_DIR'] = os.path.join(
            persistence_base, sandbox_id, 'bash_events'
        )
        env['WORKSPACE_BASE'] = working_dir

        # Export sandbox-specific worker ports so local sandboxes do not collide on
        # framework defaults like 5173 or 3000.
        for worker_name, worker_port in worker_ports.items():
            env[worker_name] = str(worker_port)
        # Many frameworks and agents default to PORT, so point it at the primary
        # sandbox worker port to keep preview startup on an isolated port.
        env['PORT'] = str(worker_ports[WORKER_1])

        # Prepare command arguments
        cmd = [
            self.python_executable,
            '-m',
            self.agent_server_module,
            '--port',
            str(port),
        ]

        _logger.info(
            f'Starting agent process for sandbox {sandbox_id}: {" ".join(cmd)}'
        )

        try:
            # Start the process - inherit stdout/stderr to see agent server logs directly
            # This helps debug startup issues in cloud environments
            process = subprocess.Popen(
                cmd,
                env=env,
                cwd=working_dir,
                stdout=sys.stdout,  # Inherit stdout to see logs
                stderr=sys.stderr,  # Inherit stderr to see errors
            )

            _logger.info(
                f'Agent process spawned with PID {process.pid} for sandbox {sandbox_id}'
            )

            # Wait a moment for the process to start
            await asyncio.sleep(1)

            # Check if process is still running
            if process.poll() is not None:
                _logger.error(
                    f'Agent process {process.pid} died immediately with return code {process.returncode}'
                )
                raise SandboxError(
                    f'Agent process failed to start with return code {process.returncode}'
                )

            _logger.info(f'Agent process {process.pid} is running after initial check')
            return process

        except Exception as e:
            raise SandboxError(f'Failed to start agent process: {e}')

    async def _wait_for_server_ready(
        self, port: int, timeout: int = 240, process: subprocess.Popen | None = None
    ) -> bool:
        """Wait for the agent server to be ready.

        Default timeout increased to 240 seconds (4 min) for resource-constrained cloud environments.
        """
        start_time = time.time()
        while time.time() - start_time < timeout:
            # Check if process died
            if process and process.poll() is not None:
                _logger.error(
                    f'Agent process died with return code {process.returncode}'
                )
                return False
            try:
                # For subprocess mode, we should connect directly to localhost
                # because the agent server runs as a child process, not in a separate container.
                # DO NOT use replace_localhost_hostname_for_docker here!
                url = f'http://localhost:{port}/alive'
                response = await self.httpx_client.get(url, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'ok':
                        _logger.info(f'Agent server on port {port} is ready!')
                        return True
            except Exception as e:
                # Log more details periodically to help debug startup issues
                elapsed = time.time() - start_time
                if (
                    elapsed > 30 and int(elapsed) % 30 == 0
                ):  # Every 30 seconds after first 30s
                    _logger.warning(
                        f'Still waiting for agent server on port {port} after {int(elapsed)}s: {type(e).__name__}: {e}'
                    )
                elif int(elapsed) % 10 == 0:  # Every 10 seconds
                    _logger.info(
                        f'Waiting for agent server on port {port} ({int(elapsed)}s elapsed): {type(e).__name__}'
                    )
            await asyncio.sleep(1)

        # Log final process state on timeout
        if process:
            is_running = process.poll() is None
            _logger.error(
                f'Agent server timeout after {timeout}s. Process running: {is_running}, return code: {process.returncode}'
            )
        return False

    def _get_process_status(self, process_info: ProcessInfo) -> SandboxStatus:
        """Get the status of a process."""
        try:
            process = psutil.Process(process_info.pid)
            if process.is_running():
                status = process.status()
                # Note: psutil.STATUS_RUNNING means "currently executing on CPU"
                # Most server processes spend time in STATUS_SLEEPING (waiting for I/O)
                # We should treat SLEEPING as RUNNING for server processes
                if status in (
                    psutil.STATUS_RUNNING,
                    psutil.STATUS_SLEEPING,
                    psutil.STATUS_DISK_SLEEP,
                ):
                    return SandboxStatus.RUNNING
                elif status == psutil.STATUS_STOPPED:
                    return SandboxStatus.PAUSED
                elif status == psutil.STATUS_ZOMBIE:
                    return SandboxStatus.ERROR
                else:
                    # Other states like STATUS_WAKING, STATUS_TRACING_STOP
                    return SandboxStatus.STARTING
            else:
                return SandboxStatus.MISSING
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return SandboxStatus.MISSING

    async def _select_primary_preview_url(
        self, worker_urls: list[ExposedUrl]
    ) -> str | None:
        """Pick the first healthy worker URL for preview."""
        for worker_url in worker_urls:
            try:
                probe_target = worker_url.url
                # Relative exposed URLs are proxied by app server; probe localhost directly.
                if probe_target.startswith('/'):
                    probe_target = f'http://localhost:{worker_url.port}/'
                response = await self.httpx_client.get(probe_target, timeout=0.8)
                if 200 <= response.status_code < 400:
                    return worker_url.url
            except Exception:
                continue
        return None

    async def _process_to_sandbox_info(
        self, sandbox_id: str, process_info: ProcessInfo
    ) -> SandboxInfo:
        """Convert process info to sandbox info."""
        status = self._get_process_status(process_info)

        exposed_urls = None
        primary_preview_url = None
        session_api_key = None

        if status == SandboxStatus.RUNNING:
            # Check if server is actually responding
            # For subprocess mode, connect directly to localhost (child process, not separate container)
            try:
                url = f'http://localhost:{process_info.port}{self.health_check_path}'
                response = await self.httpx_client.get(url, timeout=5.0)
                if response.status_code == 200:
                    # Use exposed_url_pattern for the URL that frontend will use to connect
                    # This allows configuring a public URL for remote deployments (e.g., Railway)
                    # while still using localhost for health checks (internal connection)
                    exposed_url = self.exposed_url_pattern.format(
                        port=process_info.port
                    )
                    exposed_urls = [
                        ExposedUrl(
                            name=AGENT_SERVER,
                            url=exposed_url,
                            port=process_info.port,
                        ),
                    ]
                    # Expose worker ports for dev servers (npm run dev, etc.)
                    # These sandbox-specific ports are accessed via the runtime proxy.
                    for worker_name in WORKER_PORT_NAMES:
                        worker_port = process_info.worker_ports[worker_name]
                        worker_url = self.exposed_url_pattern.format(port=worker_port)
                        exposed_urls.append(
                            ExposedUrl(
                                name=worker_name,
                                url=worker_url,
                                port=worker_port,
                            )
                        )
                    # Prefer a healthy worker endpoint as a primary preview URL.
                    worker_only_urls = [
                        exposed for exposed in exposed_urls if exposed.name.startswith('WORKER_')
                    ]
                    primary_preview_url = await self._select_primary_preview_url(
                        worker_only_urls
                    )
                    session_api_key = process_info.session_api_key
                    _logger.info(
                        f'Agent server on port {process_info.port} is healthy, exposed as {exposed_url}'
                    )
                else:
                    # Server responded but not OK - it may still be starting up
                    # Keep as STARTING instead of ERROR to allow retry
                    _logger.debug(
                        f'Agent server health check returned {response.status_code}, treating as STARTING'
                    )
                    status = SandboxStatus.STARTING
            except Exception as e:
                # Connection failed - server is likely still starting up
                # Keep as STARTING instead of ERROR to allow wait_for_sandbox_running to retry
                _logger.debug(
                    f'Agent server health check failed ({type(e).__name__}), treating as STARTING'
                )
                status = SandboxStatus.STARTING

        return SandboxInfo(
            id=sandbox_id,
            created_by_user_id=process_info.user_id,
            sandbox_spec_id=process_info.sandbox_spec_id,
            status=status,
            session_api_key=session_api_key,
            exposed_urls=exposed_urls,
            primary_preview_url=primary_preview_url,
            working_dir=process_info.working_dir,
            created_at=process_info.created_at,
        )

    def _get_agent_server_url(self, sandbox: SandboxInfo) -> str:
        """Get agent server URL from sandbox exposed URLs for internal health checks.

        Override base class to NOT replace localhost with host.docker.internal,
        because ProcessSandboxService runs the agent server as a child process,
        not in a separate Docker container.
        """
        from openhands.app_server.errors import SandboxError
        from openhands.app_server.sandbox.sandbox_models import AGENT_SERVER

        if not sandbox.exposed_urls:
            raise SandboxError(f'No exposed URLs for sandbox: {sandbox.id}')

        for exposed_url in sandbox.exposed_urls:
            if exposed_url.name == AGENT_SERVER:
                url = exposed_url.url
                # If URL is relative (e.g., /runtime/8000), use localhost for health check
                if url.startswith('/'):
                    url = f'http://localhost:{exposed_url.port}'
                return url

        raise SandboxError(f'No agent server URL found for sandbox: {sandbox.id}')

    async def search_sandboxes(
        self,
        page_id: str | None = None,
        limit: int = 100,
    ) -> SandboxPage:
        """Search for sandboxes."""
        # Get all process infos
        all_processes = list(_processes.items())

        # Sort by creation time (newest first)
        all_processes.sort(key=lambda x: x[1].created_at, reverse=True)

        # Apply pagination
        start_idx = 0
        if page_id:
            try:
                start_idx = int(page_id)
            except ValueError:
                start_idx = 0

        end_idx = start_idx + limit
        paginated_processes = all_processes[start_idx:end_idx]

        # Convert to sandbox infos
        items = []
        for sandbox_id, process_info in paginated_processes:
            sandbox_info = await self._process_to_sandbox_info(sandbox_id, process_info)
            items.append(sandbox_info)

        # Determine next page ID
        next_page_id = None
        if end_idx < len(all_processes):
            next_page_id = str(end_idx)

        return SandboxPage(items=items, next_page_id=next_page_id)

    async def get_sandbox(self, sandbox_id: str) -> SandboxInfo | None:
        """Get a single sandbox."""
        process_info = _processes.get(sandbox_id)
        if process_info is None:
            return None

        return await self._process_to_sandbox_info(sandbox_id, process_info)

    async def get_sandbox_by_session_api_key(
        self, session_api_key: str
    ) -> SandboxInfo | None:
        """Get a single sandbox by session API key."""
        # Search through all processes to find one with matching session_api_key
        for sandbox_id, process_info in _processes.items():
            if process_info.session_api_key == session_api_key:
                return await self._process_to_sandbox_info(sandbox_id, process_info)

        return None

    async def start_sandbox(
        self, sandbox_spec_id: str | None = None, sandbox_id: str | None = None
    ) -> SandboxInfo:
        """Start a new sandbox.

        If pre-warming is enabled and a warm sandbox is available, it will be
        used immediately (~0s startup). Otherwise, a new sandbox will be created
        (~5s startup).
        """
        global _warm_pool

        # Try to get a pre-warmed sandbox from the pool
        if POOL_ENABLED and sandbox_id is None:
            async with _pool_lock:
                if _warm_pool:
                    pool_sandbox_id, pool_process_info = _warm_pool.pop(0)
                    _logger.info(
                        f'Using pre-warmed sandbox {pool_sandbox_id} from pool '
                        f'(pool size now: {len(_warm_pool)})'
                    )
                    # Register in the main process dict
                    _processes[pool_sandbox_id] = pool_process_info
                    # Schedule pool replenishment in the background
                    asyncio.create_task(self._replenish_pool())
                    return await self._process_to_sandbox_info(
                        pool_sandbox_id, pool_process_info
                    )

        # No pre-warmed sandbox available, create a new one
        # Get sandbox spec
        if sandbox_spec_id is None:
            sandbox_spec = await self.sandbox_spec_service.get_default_sandbox_spec()
        else:
            sandbox_spec_maybe = await self.sandbox_spec_service.get_sandbox_spec(
                sandbox_spec_id
            )
            if sandbox_spec_maybe is None:
                raise ValueError('Sandbox Spec not found')
            sandbox_spec = sandbox_spec_maybe

        # Generate unique sandbox ID and session API key
        # Use provided sandbox_id if available, otherwise generate a random one
        if sandbox_id is None:
            sandbox_id = base62.encodebytes(os.urandom(16))
        session_api_key = base62.encodebytes(os.urandom(32))

        port, worker_ports = await self._reserve_process_ports()

        try:
            # Create sandbox directory
            working_dir = self._create_sandbox_directory(sandbox_id)

            # Start the agent process
            process = await self._start_agent_process(
                sandbox_id=sandbox_id,
                port=port,
                working_dir=working_dir,
                session_api_key=session_api_key,
                sandbox_spec=sandbox_spec,
                worker_ports=worker_ports,
            )
        except Exception:
            await self._release_port_numbers({port, *worker_ports.values()})
            raise

        # Store process info
        process_info = ProcessInfo(
            pid=process.pid,
            port=port,
            user_id=self.user_id,
            working_dir=working_dir,
            session_api_key=session_api_key,
            created_at=utc_now(),
            sandbox_spec_id=sandbox_spec.id,
            worker_ports=worker_ports,
        )
        _processes[sandbox_id] = process_info

        # Wait for server to be ready
        if not await self._wait_for_server_ready(port, process=process):
            # Clean up if server didn't start properly
            await self.delete_sandbox(sandbox_id)
            raise SandboxError('Agent Server Failed to start properly')

        return await self._process_to_sandbox_info(sandbox_id, process_info)

    async def _replenish_pool(self) -> None:
        """Replenish the warm pool after a sandbox was taken."""
        global _pool_replenish_inflight, _warm_pool

        async with _pool_lock:
            current_size = len(_warm_pool)
            if current_size + _pool_replenish_inflight >= POOL_SIZE:
                return
            _pool_replenish_inflight += 1

        _logger.info(
            f'Replenishing warm pool (current: {current_size}, target: {POOL_SIZE})'
        )

        try:
            # Pre-warm a new sandbox
            sandbox_id, process_info = await self._prewarm_sandbox()

            async with _pool_lock:
                _warm_pool.append((sandbox_id, process_info))
                _logger.info(
                    f'Added pre-warmed sandbox {sandbox_id} to pool '
                    f'(pool size now: {len(_warm_pool)})'
                )
        except Exception as e:
            _logger.warning(f'Failed to replenish warm pool: {e}')
        finally:
            async with _pool_lock:
                _pool_replenish_inflight = max(0, _pool_replenish_inflight - 1)

    async def _prewarm_sandbox(self) -> tuple[str, ProcessInfo]:
        """Pre-warm a single sandbox (directory + agent process + wait for ready)."""
        # Get default sandbox spec
        sandbox_spec = await self.sandbox_spec_service.get_default_sandbox_spec()

        # Generate unique sandbox ID and session API key
        sandbox_id = base62.encodebytes(os.urandom(16))
        session_api_key = base62.encodebytes(os.urandom(32))

        port, worker_ports = await self._reserve_process_ports()

        try:
            # Create sandbox directory
            working_dir = self._create_sandbox_directory(sandbox_id)

            # Start the agent process
            process = await self._start_agent_process(
                sandbox_id=sandbox_id,
                port=port,
                working_dir=working_dir,
                session_api_key=session_api_key,
                sandbox_spec=sandbox_spec,
                worker_ports=worker_ports,
            )
        except Exception:
            await self._release_port_numbers({port, *worker_ports.values()})
            raise

        # Create process info
        process_info = ProcessInfo(
            pid=process.pid,
            port=port,
            user_id=self.user_id,
            working_dir=working_dir,
            session_api_key=session_api_key,
            created_at=utc_now(),
            sandbox_spec_id=sandbox_spec.id,
            worker_ports=worker_ports,
        )

        # Wait for server to be ready
        if not await self._wait_for_server_ready(port, process=process):
            # Clean up if server didn't start properly
            try:
                process.terminate()
                process.wait(timeout=5)
            except Exception:
                pass
            await self._release_port_numbers({port, *worker_ports.values()})
            raise SandboxError('Pre-warmed agent server failed to start')

        _logger.info(f'Pre-warmed sandbox {sandbox_id} is ready on port {port}')
        return sandbox_id, process_info

    async def warm_pool(self) -> int:
        """Initialize the warm pool at startup. Returns number of sandboxes pre-warmed."""
        global _warm_pool

        if not POOL_ENABLED:
            _logger.info('Sandbox pool pre-warming is disabled')
            return 0

        _logger.info(f'Starting sandbox pool pre-warming (target size: {POOL_SIZE})')

        warmed = 0
        for i in range(POOL_SIZE):
            try:
                sandbox_id, process_info = await self._prewarm_sandbox()
                async with _pool_lock:
                    _warm_pool.append((sandbox_id, process_info))
                warmed += 1
                _logger.info(f'Pre-warmed sandbox {i + 1}/{POOL_SIZE}: {sandbox_id}')
            except Exception as e:
                _logger.warning(f'Failed to pre-warm sandbox {i + 1}/{POOL_SIZE}: {e}')

        _logger.info(f'Sandbox pool pre-warming complete: {warmed}/{POOL_SIZE} ready')
        return warmed

    async def resume_sandbox(self, sandbox_id: str) -> bool:
        """Resume a paused sandbox."""
        process_info = _processes.get(sandbox_id)
        if process_info is None:
            return False

        try:
            process = psutil.Process(process_info.pid)
            if process.status() == psutil.STATUS_STOPPED:
                process.resume()
            return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return False

    async def pause_sandbox(self, sandbox_id: str) -> bool:
        """Pause a running sandbox."""
        process_info = _processes.get(sandbox_id)
        if process_info is None:
            return False

        try:
            process = psutil.Process(process_info.pid)
            if process.is_running():
                process.suspend()
            return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return False

    async def delete_sandbox(self, sandbox_id: str) -> bool:
        """Delete a sandbox."""
        process_info = _processes.get(sandbox_id)
        if process_info is None:
            return False

        try:
            # Terminate the process
            process = psutil.Process(process_info.pid)
            if process.is_running():
                # Try graceful termination first
                process.terminate()
                try:
                    process.wait(timeout=10)
                except psutil.TimeoutExpired:
                    # Force kill if graceful termination fails
                    process.kill()
                    process.wait(timeout=5)

            # Clean up the working directory
            import shutil

            if os.path.exists(process_info.working_dir):
                shutil.rmtree(process_info.working_dir, ignore_errors=True)

            # Remove from our tracking
            del _processes[sandbox_id]
            await self._release_port_numbers(
                {process_info.port, *process_info.worker_ports.values()}
            )

            return True

        except (psutil.NoSuchProcess, psutil.AccessDenied, OSError) as e:
            _logger.warning(f'Error deleting sandbox {sandbox_id}: {e}')
            # Still remove from tracking even if cleanup failed
            if sandbox_id in _processes:
                del _processes[sandbox_id]
            await self._release_port_numbers(
                {process_info.port, *process_info.worker_ports.values()}
            )
            return True


class ProcessSandboxServiceInjector(SandboxServiceInjector):
    """Dependency injector for process sandbox services."""

    base_working_dir: str = Field(
        default='/tmp/openhands-sandboxes',
        description='Base directory for sandbox working directories',
    )
    base_port: int = Field(
        default=8000, description='Base port number for agent servers'
    )
    python_executable: str = Field(
        default=sys.executable,
        description='Python executable to use for agent processes',
    )
    agent_server_module: str = Field(
        default='openhands.agent_server',
        description='Python module for the agent server',
    )
    health_check_path: str = Field(
        default='/alive', description='Health check endpoint path'
    )
    exposed_url_pattern: str = Field(
        default='/runtime/{port}',
        description=(
            'URL pattern for exposed sandbox ports. Use {port} as placeholder. '
            'Default is "/runtime/{port}" which uses the built-in proxy endpoint. '
            'The frontend will use its own host with this relative path. '
            'For direct access (e.g., local development), set to '
            '"http://localhost:{port}". '
            'Configure via OH_SANDBOX_EXPOSED_URL_PATTERN environment variable.'
        ),
    )

    async def inject(
        self, state: InjectorState, request: Request | None = None
    ) -> AsyncGenerator[SandboxService, None]:
        # Define inline to prevent circular lookup
        from openhands.app_server.config import (
            get_httpx_client,
            get_sandbox_spec_service,
            get_user_context,
        )

        async with (
            get_httpx_client(state, request) as httpx_client,
            get_sandbox_spec_service(state, request) as sandbox_spec_service,
            get_user_context(state, request) as user_context,
        ):
            user_id = await user_context.get_user_id()
            yield ProcessSandboxService(
                user_id=user_id,
                sandbox_spec_service=sandbox_spec_service,
                base_working_dir=self.base_working_dir,
                base_port=self.base_port,
                python_executable=self.python_executable,
                agent_server_module=self.agent_server_module,
                health_check_path=self.health_check_path,
                httpx_client=httpx_client,
                exposed_url_pattern=self.exposed_url_pattern,
            )
