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

            # Create sandbox - Daytona SDK handles the creation
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
        """Get exposed URLs from Daytona sandbox."""
        exposed_urls = []
        try:
            # Get preview link for agent server port
            agent_url = await asyncio.to_thread(
                sandbox.get_preview_link, DAYTONA_AGENT_SERVER_PORT
            )
            exposed_urls.append(
                ExposedUrl(
                    name=AGENT_SERVER,
                    url=agent_url.url,
                    port=DAYTONA_AGENT_SERVER_PORT,
                )
            )

            # Get preview link for VSCode port
            vscode_url = await asyncio.to_thread(
                sandbox.get_preview_link, DAYTONA_VSCODE_PORT
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

    async def _start_agent_server(
        self,
        sandbox: 'Sandbox',
        session_api_key: str,
        spec: SandboxSpecInfo | None,
    ) -> None:
        """Start the agent server inside the Daytona sandbox."""
        # Build environment variables
        env_vars = {
            'SESSION_API_KEY': session_api_key,
            'PYTHONUNBUFFERED': '1',
        }
        if spec and spec.initial_env:
            env_vars.update(spec.initial_env)

        # Build command to start agent server
        cmd = f'python -m openhands.agent_server --port {DAYTONA_AGENT_SERVER_PORT}'

        _logger.info(f'Starting agent server in Daytona sandbox: {cmd}')

        try:
            # Execute command in sandbox session
            # Run in background so we don't block
            await asyncio.to_thread(
                sandbox.process.exec,
                cmd,
                timeout=10,  # Just start it, don't wait for completion
            )
        except Exception as e:
            # The command may timeout because it's a long-running process
            # This is expected behavior
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
                )
