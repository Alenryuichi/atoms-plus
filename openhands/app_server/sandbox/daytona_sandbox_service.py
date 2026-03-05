"""Daytona-based sandbox service implementation.

This service creates sandboxes using Daytona's cloud sandbox API.
Daytona provides secure, isolated cloud development environments.
"""

import asyncio
import logging
import os
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, AsyncGenerator

import base62
import httpx
from fastapi import Request
from pydantic import Field

from openhands.agent_server.utils import utc_now
from openhands.app_server.errors import SandboxError
from openhands.app_server.sandbox.sandbox_models import (
    AGENT_SERVER,
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

if TYPE_CHECKING:
    from daytona import Daytona, Sandbox

_logger = logging.getLogger(__name__)

# Store sandbox info in memory (maps our sandbox_id to Daytona sandbox info)
_daytona_sandboxes: dict[str, dict[str, Any]] = {}

# Default ports for agent server and VSCode
DAYTONA_AGENT_SERVER_PORT = 4444
DAYTONA_VSCODE_PORT = 4445


@dataclass
class DaytonaSandboxService(SandboxService):
    """Sandbox service that uses Daytona's cloud sandbox API."""

    user_id: str | None
    sandbox_spec_service: SandboxSpecService
    api_key: str
    api_url: str
    target: str
    httpx_client: httpx.AsyncClient
    snapshot: str | None = None  # Optional: use pre-built snapshot for faster startup

    async def search_sandboxes(
        self,
        page_id: str | None = None,
        limit: int = 100,
    ) -> SandboxPage:
        """Search for sandboxes."""
        sandboxes = []
        for sandbox_id, info in _daytona_sandboxes.items():
            if self.user_id and info.get('user_id') != self.user_id:
                continue
            sandboxes.append(
                SandboxInfo(
                    id=sandbox_id,
                    created_by_user_id=info.get('user_id'),
                    sandbox_spec_id=info.get('sandbox_spec_id', 'default'),
                    status=SandboxStatus.RUNNING,
                    session_api_key=info.get('session_api_key'),
                    exposed_urls=info.get('exposed_urls', []),
                    created_at=info.get('created_at', utc_now()),
                )
            )
        return SandboxPage(items=sandboxes[:limit], next_page_id=None)

    async def get_sandbox(self, sandbox_id: str) -> SandboxInfo | None:
        """Get sandbox by ID."""
        info = _daytona_sandboxes.get(sandbox_id)
        if not info:
            return None
        return SandboxInfo(
            id=sandbox_id,
            created_by_user_id=info.get('user_id'),
            sandbox_spec_id=info.get('sandbox_spec_id', 'default'),
            status=SandboxStatus.RUNNING,
            session_api_key=info.get('session_api_key'),
            exposed_urls=info.get('exposed_urls', []),
            created_at=info.get('created_at', utc_now()),
        )

    async def get_sandbox_by_session_api_key(
        self, session_api_key: str
    ) -> SandboxInfo | None:
        """Get a single sandbox by session API key."""
        for sandbox_id, info in _daytona_sandboxes.items():
            if info.get('session_api_key') == session_api_key:
                return SandboxInfo(
                    id=sandbox_id,
                    created_by_user_id=info.get('user_id'),
                    sandbox_spec_id=info.get('sandbox_spec_id', 'default'),
                    status=SandboxStatus.RUNNING,
                    session_api_key=info.get('session_api_key'),
                    exposed_urls=info.get('exposed_urls', []),
                    created_at=info.get('created_at', utc_now()),
                )
        return None

    def _get_daytona_client(self) -> 'Daytona':
        """Create and return a Daytona client instance."""
        try:
            from daytona import Daytona, DaytonaConfig
        except ImportError:
            raise SandboxError(
                'Daytona SDK not installed. Install with: pip install daytona-sdk'
            )

        config = DaytonaConfig(
            api_key=self.api_key,
            server_url=self.api_url,
            target=self.target,
        )
        return Daytona(config)

    async def start_sandbox(
        self, sandbox_spec_id: str | None = None, sandbox_id: str | None = None
    ) -> SandboxInfo:
        """Start a new Daytona sandbox.

        Creates a cloud sandbox using Daytona's API, starts the agent server,
        and returns sandbox info with exposed URLs.
        """
        if sandbox_id is None:
            sandbox_id = base62.encodebytes(os.urandom(16))

        _logger.info(f'Creating Daytona sandbox: {sandbox_id}')

        try:
            daytona = self._get_daytona_client()

            # Get sandbox spec for configuration
            specs_page = await self.sandbox_spec_service.search_sandbox_specs()
            spec = specs_page.items[0] if specs_page.items else None

            # Create sandbox - use snapshot if configured for faster startup
            if self.snapshot:
                _logger.info(
                    f'Using pre-built snapshot "{self.snapshot}" for faster startup'
                )
                try:
                    from daytona import CreateSandboxFromSnapshotParams

                    sandbox = await asyncio.to_thread(
                        daytona.create,
                        CreateSandboxFromSnapshotParams(snapshot=self.snapshot),
                    )
                except ImportError:
                    _logger.warning(
                        'CreateSandboxFromSnapshotParams not available, falling back to default'
                    )
                    sandbox = await asyncio.to_thread(daytona.create)
            else:
                # The SDK will use its default Python sandbox image
                sandbox = await asyncio.to_thread(daytona.create)

            _logger.info(f'Daytona sandbox created with ID: {sandbox.id}')

            # Generate session API key for authentication
            session_api_key = base62.encodebytes(os.urandom(32))

            # Get exposed URLs from Daytona sandbox
            exposed_urls = await self._get_exposed_urls(sandbox)

            # Start the agent server in the sandbox
            await self._start_agent_server(sandbox, session_api_key, spec)

            # Store sandbox info
            _daytona_sandboxes[sandbox_id] = {
                'daytona_id': sandbox.id,
                'daytona_sandbox': sandbox,
                'user_id': self.user_id,
                'sandbox_spec_id': sandbox_spec_id or 'default',
                'session_api_key': session_api_key,
                'created_at': utc_now(),
                'exposed_urls': exposed_urls,
                'status': SandboxStatus.RUNNING,
            }

            return SandboxInfo(
                id=sandbox_id,
                created_by_user_id=self.user_id,
                sandbox_spec_id=sandbox_spec_id or 'default',
                status=SandboxStatus.RUNNING,
                session_api_key=session_api_key,
                exposed_urls=exposed_urls,
                created_at=utc_now(),
            )
        except SandboxError:
            raise
        except Exception as e:
            _logger.exception(f'Failed to create Daytona sandbox: {e}')
            raise SandboxError(f'Failed to create Daytona sandbox: {e}')

    async def _get_exposed_urls(self, sandbox: 'Sandbox') -> list[ExposedUrl]:
        """Get exposed URLs from Daytona sandbox.

        Uses create_signed_preview_url() instead of get_preview_link() because:
        - get_preview_link() returns URLs that require Auth0 authentication (307 redirect)
        - create_signed_preview_url() returns URLs with embedded auth tokens for direct access
        """
        exposed_urls = []
        try:
            # Get SIGNED preview URL for agent server port (bypasses Auth0 redirect)
            agent_url = await asyncio.to_thread(
                sandbox.create_signed_preview_url, DAYTONA_AGENT_SERVER_PORT
            )
            exposed_urls.append(
                ExposedUrl(
                    name=AGENT_SERVER,
                    url=agent_url.url,
                    port=DAYTONA_AGENT_SERVER_PORT,
                )
            )
            _logger.info(f'Got signed preview URL for agent server: {agent_url.url}')

            # Get SIGNED preview URL for VSCode port
            vscode_url = await asyncio.to_thread(
                sandbox.create_signed_preview_url, DAYTONA_VSCODE_PORT
            )
            exposed_urls.append(
                ExposedUrl(
                    name='vscode',
                    url=vscode_url.url,
                    port=DAYTONA_VSCODE_PORT,
                )
            )
        except Exception as e:
            _logger.warning(f'Failed to get exposed URLs: {e}')

        return exposed_urls

    async def _install_openhands_in_sandbox(self, sandbox: 'Sandbox') -> None:
        """Install openhands-ai package in the Daytona sandbox.

        Since Daytona SDK 0.24.x doesn't support creating sandboxes from Docker images,
        we need to install the openhands package manually via pip.
        """
        _logger.info('Installing openhands-ai package in Daytona sandbox...')

        # Install openhands from PyPI
        # Using --quiet to reduce output, --no-cache-dir to save space
        install_cmd = (
            'pip install --quiet --no-cache-dir openhands-ai && '
            "echo 'openhands installation complete'"
        )

        try:
            result = await asyncio.to_thread(
                sandbox.process.exec,
                install_cmd,
                timeout=300,  # pip install can take a while
            )
            _logger.info(
                f'pip install result: {result.result if hasattr(result, "result") else result}'
            )
        except Exception as e:
            _logger.error(f'Failed to install openhands: {e}')
            raise SandboxError(f'Failed to install openhands in Daytona sandbox: {e}')

    async def _start_agent_server(
        self,
        sandbox: 'Sandbox',
        session_api_key: str,
        spec: SandboxSpecInfo | None,
    ) -> None:
        """Start the agent server inside the Daytona sandbox."""
        # Skip pip install if using a pre-built snapshot that already has openhands
        if self.snapshot:
            _logger.info(
                f'Using snapshot "{self.snapshot}" - skipping pip install (openhands should be pre-installed)'
            )
        else:
            # Install openhands package since Daytona's default Python sandbox
            # doesn't have it pre-installed
            await self._install_openhands_in_sandbox(sandbox)

        # Build environment variables
        env_vars = {
            'SESSION_API_KEY': session_api_key,
            'PYTHONUNBUFFERED': '1',
        }
        if spec and spec.initial_env:
            env_vars.update(spec.initial_env)

        # Build command to start agent server
        # First kill any existing agent server process to avoid port conflicts
        kill_cmd = f"pkill -f 'openhands.agent_server.*--port {DAYTONA_AGENT_SERVER_PORT}' 2>/dev/null || true"

        # Use nohup and & to run in background, redirect output to log file
        start_cmd = (
            f'nohup python -m openhands.agent_server --port {DAYTONA_AGENT_SERVER_PORT} '
            f'> /tmp/agent_server.log 2>&1 &'
        )

        _logger.info(
            f'Starting agent server in Daytona sandbox on port {DAYTONA_AGENT_SERVER_PORT}'
        )

        try:
            # Kill any existing process first
            await asyncio.to_thread(
                sandbox.process.exec,
                kill_cmd,
                timeout=5,
            )

            # Small delay to ensure port is released
            await asyncio.sleep(0.5)

            # Start the agent server in background
            await asyncio.to_thread(
                sandbox.process.exec,
                start_cmd,
                timeout=5,  # Should return quickly since we're using nohup &
            )
            _logger.info('Agent server start command executed successfully')
        except Exception as e:
            # Log but don't fail - the process might still start
            _logger.debug(f'Agent server start command returned: {e}')

    async def resume_sandbox(self, sandbox_id: str) -> bool:
        """Resume a paused Daytona sandbox."""
        info = _daytona_sandboxes.get(sandbox_id)
        if not info:
            return False

        sandbox = info.get('daytona_sandbox')
        if sandbox:
            try:
                await asyncio.to_thread(sandbox.start)
                info['status'] = SandboxStatus.RUNNING
                _logger.info(f'Resumed Daytona sandbox: {sandbox_id}')
                return True
            except Exception as e:
                _logger.error(f'Failed to resume sandbox {sandbox_id}: {e}')
                return False
        return True

    async def pause_sandbox(self, sandbox_id: str) -> bool:
        """Pause a running Daytona sandbox."""
        info = _daytona_sandboxes.get(sandbox_id)
        if not info:
            return False

        sandbox = info.get('daytona_sandbox')
        if sandbox:
            try:
                await asyncio.to_thread(sandbox.stop)
                info['status'] = SandboxStatus.PAUSED
                _logger.info(f'Paused Daytona sandbox: {sandbox_id}')
                return True
            except Exception as e:
                _logger.error(f'Failed to pause sandbox {sandbox_id}: {e}')
                return False
        return True

    async def delete_sandbox(self, sandbox_id: str) -> bool:
        """Delete a Daytona sandbox."""
        info = _daytona_sandboxes.get(sandbox_id)
        if not info:
            return False

        sandbox = info.get('daytona_sandbox')
        if sandbox:
            try:
                daytona = self._get_daytona_client()
                await asyncio.to_thread(daytona.delete, sandbox)
                _logger.info(f'Deleted Daytona sandbox: {sandbox_id}')
            except Exception as e:
                _logger.error(f'Failed to delete sandbox from Daytona: {e}')

        # Remove from local cache regardless
        del _daytona_sandboxes[sandbox_id]
        return True


def validate_daytona_config() -> None:
    """Validate Daytona configuration at startup.

    Raises ValueError if required environment variables are missing.
    """
    api_key = os.getenv('DAYTONA_API_KEY')
    if not api_key:
        raise ValueError(
            'DAYTONA_API_KEY environment variable is required when RUNTIME=daytona. '
            'Get your API key from https://app.daytona.io/settings/api-keys'
        )
    _logger.info('Daytona configuration validated successfully')


class DaytonaSandboxServiceInjector(SandboxServiceInjector):
    """Injector for DaytonaSandboxService.

    Required environment variables:
    - DAYTONA_API_KEY: Your Daytona API key (required)
    - DAYTONA_API_URL: Daytona API URL (default: https://app.daytona.io/api)
    - DAYTONA_TARGET: Target region (default: eu, options: eu, us)
    - DAYTONA_SNAPSHOT: Pre-built snapshot name (optional, for faster startup)
    """

    api_key: str = Field(
        default_factory=lambda: os.getenv('DAYTONA_API_KEY', ''),
        description='Daytona API key (required)',
    )
    api_url: str = Field(
        default_factory=lambda: os.getenv(
            'DAYTONA_API_URL', 'https://app.daytona.io/api'
        ),
        description='Daytona API URL',
    )
    target: str = Field(
        default_factory=lambda: os.getenv('DAYTONA_TARGET', 'eu'),
        description='Daytona target region (eu or us)',
    )
    snapshot: str | None = Field(
        default_factory=lambda: os.getenv('DAYTONA_SNAPSHOT'),
        description='Pre-built snapshot name with openhands pre-installed (for faster startup)',
    )

    def model_post_init(self, __context: Any) -> None:
        """Validate configuration after model initialization."""
        if not self.api_key:
            _logger.warning(
                'DAYTONA_API_KEY not set. Daytona sandbox creation will fail. '
                'Set DAYTONA_API_KEY environment variable to enable Daytona sandboxes.'
            )

    async def inject(
        self, state: InjectorState, request: Request | None = None
    ) -> AsyncGenerator[DaytonaSandboxService, None]:
        from openhands.app_server.config import (
            get_sandbox_spec_service,
            get_user_context,
        )

        # Validate API key before creating service
        if not self.api_key:
            raise SandboxError(
                'Daytona API key not configured. '
                'Set DAYTONA_API_KEY environment variable.'
            )

        async with (
            get_sandbox_spec_service(state, request) as sandbox_spec_service,
            get_user_context(state, request) as user_context,
        ):
            user_id = await user_context.get_user_id()
            async with httpx.AsyncClient() as client:
                yield DaytonaSandboxService(
                    user_id=user_id,
                    sandbox_spec_service=sandbox_spec_service,
                    api_key=self.api_key,
                    api_url=self.api_url,
                    target=self.target,
                    httpx_client=client,
                    snapshot=self.snapshot,
                )
