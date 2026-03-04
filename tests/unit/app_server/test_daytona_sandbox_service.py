"""Tests for DaytonaSandboxService."""

import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from openhands.app_server.errors import SandboxError
from openhands.app_server.sandbox.daytona_sandbox_service import (
    DAYTONA_AGENT_SERVER_PORT,
    DAYTONA_VSCODE_PORT,
    DaytonaSandboxService,
    DaytonaSandboxServiceInjector,
    _daytona_sandboxes,
    validate_daytona_config,
)
from openhands.app_server.sandbox.sandbox_models import (
    AGENT_SERVER,
    SandboxStatus,
)
from openhands.app_server.sandbox.sandbox_spec_models import (
    SandboxSpecInfo,
)


class MockSandboxSpec:
    """Mock sandbox specification."""

    def __init__(self):
        self.id = 'test-spec'
        self.initial_env = {'TEST_VAR': 'test_value'}


class MockSandboxSpecService:
    """Mock sandbox spec service."""

    async def search_sandbox_specs(self):
        # Return SandboxSpecInfoPage-like object with items attribute
        page = MagicMock()
        page.items = [
            SandboxSpecInfo(
                id='test-spec',
                command=['python', '-m', 'openhands.agent_server'],
                initial_env={'TEST_VAR': 'test_value'},
            )
        ]
        return page

    async def get_default_sandbox_spec(self):
        return SandboxSpecInfo(
            id='test-spec',
            command=['python', '-m', 'openhands.agent_server'],
            initial_env={'TEST_VAR': 'test_value'},
        )

    async def get_sandbox_spec(self, spec_id: str):
        if spec_id == 'test-spec':
            return SandboxSpecInfo(
                id='test-spec',
                command=['python', '-m', 'openhands.agent_server'],
                initial_env={'TEST_VAR': 'test_value'},
            )
        return None


class MockDaytonaSandbox:
    """Mock Daytona sandbox object."""

    def __init__(self, sandbox_id: str = 'daytona-sandbox-123'):
        self.id = sandbox_id
        self.state = 'running'

    def get_preview_link(self, port: int):
        """Return mock preview link."""
        mock_link = MagicMock()
        mock_link.url = f'https://sandbox-{self.id}.daytona.io:{port}'
        return mock_link

    def start(self):
        self.state = 'running'

    def stop(self):
        self.state = 'stopped'


class MockDaytona:
    """Mock Daytona client."""

    def __init__(self, config=None):
        self.config = config
        self._sandboxes = []

    def create(self):
        sandbox = MockDaytonaSandbox()
        self._sandboxes.append(sandbox)
        return sandbox

    def delete(self, sandbox):
        if sandbox in self._sandboxes:
            self._sandboxes.remove(sandbox)


@pytest.fixture
def mock_httpx_client():
    """Mock httpx client."""
    return AsyncMock(spec=httpx.AsyncClient)


@pytest.fixture
def daytona_sandbox_service(mock_httpx_client):
    """Create a DaytonaSandboxService instance for testing."""
    # Clear global sandbox cache before each test
    _daytona_sandboxes.clear()

    return DaytonaSandboxService(
        user_id='test-user-id',
        sandbox_spec_service=MockSandboxSpecService(),
        api_key='test-api-key',
        api_url='https://app.daytona.io/api',
        target='eu',
        httpx_client=mock_httpx_client,
    )


@pytest.fixture(autouse=True)
def cleanup_sandboxes():
    """Clean up sandbox cache after each test."""
    yield
    _daytona_sandboxes.clear()


class TestDaytonaSandboxService:
    """Test cases for DaytonaSandboxService."""

    def test_get_daytona_client_missing_sdk(self, daytona_sandbox_service):
        """Test that _get_daytona_client raises error when SDK not installed."""
        with patch.dict('sys.modules', {'daytona': None}):
            with pytest.raises(SandboxError, match='Daytona SDK not installed'):
                daytona_sandbox_service._get_daytona_client()

    @pytest.mark.asyncio
    async def test_search_sandboxes_empty(self, daytona_sandbox_service):
        """Test searching sandboxes when none exist."""
        result = await daytona_sandbox_service.search_sandboxes()
        assert len(result.items) == 0
        assert result.next_page_id is None

    @pytest.mark.asyncio
    async def test_get_sandbox_not_found(self, daytona_sandbox_service):
        """Test getting a sandbox that doesn't exist."""
        result = await daytona_sandbox_service.get_sandbox('nonexistent')
        assert result is None

    @pytest.mark.asyncio
    async def test_get_sandbox_by_session_api_key_not_found(
        self, daytona_sandbox_service
    ):
        """Test getting sandbox by session API key when not found."""
        result = await daytona_sandbox_service.get_sandbox_by_session_api_key(
            'invalid-key'
        )
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_sandbox_not_found(self, daytona_sandbox_service):
        """Test deleting a sandbox that doesn't exist."""
        result = await daytona_sandbox_service.delete_sandbox('nonexistent')
        assert result is False

    @pytest.mark.asyncio
    async def test_resume_sandbox_not_found(self, daytona_sandbox_service):
        """Test resuming a sandbox that doesn't exist."""
        result = await daytona_sandbox_service.resume_sandbox('nonexistent')
        assert result is False

    @pytest.mark.asyncio
    async def test_pause_sandbox_not_found(self, daytona_sandbox_service):
        """Test pausing a sandbox that doesn't exist."""
        result = await daytona_sandbox_service.pause_sandbox('nonexistent')
        assert result is False


class TestDaytonaSandboxServiceInjector:
    """Test cases for DaytonaSandboxServiceInjector."""

    def test_injector_default_values(self):
        """Test injector uses environment variables for defaults."""
        with patch.dict(os.environ, {}, clear=True):
            injector = DaytonaSandboxServiceInjector()
            assert injector.api_key == ''
            assert 'daytona.io' in injector.api_url

    def test_injector_with_env_vars(self):
        """Test injector reads from environment variables."""
        with patch.dict(
            os.environ,
            {
                'DAYTONA_API_KEY': 'my-secret-key',
                'DAYTONA_API_URL': 'https://custom.daytona.io/api',
                'DAYTONA_TARGET': 'us',
            },
        ):
            injector = DaytonaSandboxServiceInjector()
            assert injector.api_key == 'my-secret-key'
            assert injector.api_url == 'https://custom.daytona.io/api'
            assert injector.target == 'us'

    def test_injector_explicit_values(self):
        """Test injector accepts explicit values."""
        injector = DaytonaSandboxServiceInjector(
            api_key='explicit-key',
            api_url='https://explicit.api.io',
            target='custom',
        )
        assert injector.api_key == 'explicit-key'
        assert injector.api_url == 'https://explicit.api.io'
        assert injector.target == 'custom'


class TestValidateDaytonaConfig:
    """Test cases for validate_daytona_config function."""

    def test_validate_missing_api_key(self):
        """Test validation fails when API key is missing."""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match='DAYTONA_API_KEY'):
                validate_daytona_config()

    def test_validate_with_api_key(self):
        """Test validation passes when API key is set."""
        with patch.dict(os.environ, {'DAYTONA_API_KEY': 'test-key'}):
            # Should not raise
            validate_daytona_config()


class TestDaytonaConstants:
    """Test Daytona constants are correctly defined."""

    def test_port_constants(self):
        """Test port constants have expected values."""
        assert DAYTONA_AGENT_SERVER_PORT == 4444
        assert DAYTONA_VSCODE_PORT == 4445


class TestConfigRoutesToDaytonaService:
    """Test that RUNTIME=daytona correctly routes to DaytonaSandboxService."""

    def test_config_routes_to_daytona_service(self):
        """Verify RUNTIME=daytona routes to DaytonaSandboxServiceInjector."""
        with patch.dict(
            os.environ,
            {
                'RUNTIME': 'daytona',
                'DAYTONA_API_KEY': 'test-api-key',
                'DAYTONA_API_URL': 'https://test.daytona.io/api',
                'DAYTONA_TARGET': 'us',
            },
            clear=False,
        ):
            # Import config_from_env after setting environment
            from openhands.app_server.config import config_from_env

            config = config_from_env()

            # Verify sandbox injector is DaytonaSandboxServiceInjector
            assert isinstance(config.sandbox, DaytonaSandboxServiceInjector)
            assert config.sandbox.api_key == 'test-api-key'
            assert config.sandbox.api_url == 'https://test.daytona.io/api'
            assert config.sandbox.target == 'us'

    def test_config_routes_to_daytona_spec_service(self):
        """Verify RUNTIME=daytona routes to DaytonaSandboxSpecServiceInjector."""
        with patch.dict(
            os.environ,
            {
                'RUNTIME': 'daytona',
                'DAYTONA_API_KEY': 'test-api-key',
            },
            clear=False,
        ):
            from openhands.app_server.config import config_from_env
            from openhands.app_server.sandbox.daytona_sandbox_spec_service import (
                DaytonaSandboxSpecServiceInjector,
            )

            config = config_from_env()

            # Verify sandbox_spec injector is DaytonaSandboxSpecServiceInjector
            assert isinstance(config.sandbox_spec, DaytonaSandboxSpecServiceInjector)

    def test_local_runtime_does_not_use_daytona(self):
        """Verify RUNTIME=local does NOT route to Daytona."""
        with patch.dict(
            os.environ,
            {
                'RUNTIME': 'local',
            },
            clear=False,
        ):
            from openhands.app_server.config import config_from_env
            from openhands.app_server.sandbox.process_sandbox_service import (
                ProcessSandboxServiceInjector,
            )

            config = config_from_env()

            # Should be ProcessSandboxServiceInjector, not Daytona
            assert isinstance(config.sandbox, ProcessSandboxServiceInjector)
            assert not isinstance(config.sandbox, DaytonaSandboxServiceInjector)


class TestSandboxLifecycleWithMockedSDK:
    """Test complete sandbox lifecycle with mocked Daytona SDK."""

    @pytest.fixture
    def mock_daytona_module(self):
        """Create mock Daytona module and classes."""
        mock_sandbox = MagicMock()
        mock_sandbox.id = 'mock-daytona-id-123'
        mock_sandbox.state = 'running'

        # Mock get_preview_link to return proper URL objects
        def mock_get_preview_link(port):
            link = MagicMock()
            link.url = f'https://mock-sandbox.daytona.io:{port}'
            return link

        mock_sandbox.get_preview_link = mock_get_preview_link
        mock_sandbox.process = MagicMock()
        mock_sandbox.process.exec = MagicMock()
        mock_sandbox.start = MagicMock()
        mock_sandbox.stop = MagicMock()

        mock_daytona_client = MagicMock()
        mock_daytona_client.create = MagicMock(return_value=mock_sandbox)
        mock_daytona_client.delete = MagicMock()

        mock_daytona_config = MagicMock()

        # Create mock module
        mock_module = MagicMock()
        mock_module.Daytona = MagicMock(return_value=mock_daytona_client)
        mock_module.DaytonaConfig = mock_daytona_config

        return mock_module, mock_sandbox, mock_daytona_client

    @pytest.fixture
    def service_with_mocked_sdk(self, mock_httpx_client, mock_daytona_module):
        """Create service with mocked Daytona SDK."""
        _daytona_sandboxes.clear()

        mock_spec_service = MagicMock()
        mock_spec_page = MagicMock()
        mock_spec_page.items = [
            SandboxSpecInfo(
                id='test-spec',
                command=['python', '-m', 'openhands.agent_server'],
                initial_env={'TEST': 'value'},
            )
        ]
        mock_spec_service.search_sandbox_specs = AsyncMock(return_value=mock_spec_page)

        return DaytonaSandboxService(
            user_id='test-user',
            sandbox_spec_service=mock_spec_service,
            api_key='test-api-key',
            api_url='https://app.daytona.io/api',
            target='eu',
            httpx_client=mock_httpx_client,
        )

    @pytest.mark.asyncio
    async def test_full_lifecycle_create_pause_resume_delete(
        self, service_with_mocked_sdk, mock_daytona_module
    ):
        """Test complete lifecycle: create → get → pause → resume → delete."""
        mock_module, mock_sandbox, mock_daytona_client = mock_daytona_module

        with patch.dict(sys.modules, {'daytona': mock_module}):
            # 1. Create sandbox
            sandbox_info = await service_with_mocked_sdk.start_sandbox(
                sandbox_spec_id='test-spec'
            )

            assert sandbox_info is not None
            assert sandbox_info.status == SandboxStatus.RUNNING
            assert sandbox_info.session_api_key is not None
            assert len(sandbox_info.session_api_key) > 0

            sandbox_id = sandbox_info.id

            # 2. Get sandbox
            retrieved = await service_with_mocked_sdk.get_sandbox(sandbox_id)
            assert retrieved is not None
            assert retrieved.id == sandbox_id

            # 3. Pause sandbox
            paused = await service_with_mocked_sdk.pause_sandbox(sandbox_id)
            assert paused is True

            # 4. Resume sandbox
            resumed = await service_with_mocked_sdk.resume_sandbox(sandbox_id)
            assert resumed is True

            # 5. Delete sandbox
            deleted = await service_with_mocked_sdk.delete_sandbox(sandbox_id)
            assert deleted is True

            # Verify sandbox no longer exists
            after_delete = await service_with_mocked_sdk.get_sandbox(sandbox_id)
            assert after_delete is None

    @pytest.mark.asyncio
    async def test_search_sandboxes_returns_created(
        self, service_with_mocked_sdk, mock_daytona_module
    ):
        """Test that created sandbox appears in search results."""
        mock_module, mock_sandbox, _ = mock_daytona_module

        with patch.dict(sys.modules, {'daytona': mock_module}):
            # Create a sandbox
            sandbox_info = await service_with_mocked_sdk.start_sandbox()

            # Search should return it
            page = await service_with_mocked_sdk.search_sandboxes()
            assert len(page.items) == 1
            assert page.items[0].id == sandbox_info.id

    @pytest.mark.asyncio
    async def test_get_by_session_api_key(
        self, service_with_mocked_sdk, mock_daytona_module
    ):
        """Test getting sandbox by session API key."""
        mock_module, mock_sandbox, _ = mock_daytona_module

        with patch.dict(sys.modules, {'daytona': mock_module}):
            # Create a sandbox
            sandbox_info = await service_with_mocked_sdk.start_sandbox()

            # Get by session API key
            found = await service_with_mocked_sdk.get_sandbox_by_session_api_key(
                sandbox_info.session_api_key
            )
            assert found is not None
            assert found.id == sandbox_info.id


class TestExposedUrlsFormat:
    """Test that exposed URLs have correct format for frontend compatibility."""

    @pytest.fixture
    def mock_daytona_for_urls(self):
        """Create mock Daytona that returns specific URLs."""
        mock_sandbox = MagicMock()
        mock_sandbox.id = 'url-test-sandbox'
        mock_sandbox.state = 'running'
        mock_sandbox.process = MagicMock()
        mock_sandbox.process.exec = MagicMock()

        def mock_get_preview_link(port):
            link = MagicMock()
            # Simulate Daytona's URL format
            link.url = f'https://url-test-sandbox.daytona.app/proxy/{port}'
            return link

        mock_sandbox.get_preview_link = mock_get_preview_link

        mock_client = MagicMock()
        mock_client.create = MagicMock(return_value=mock_sandbox)

        mock_module = MagicMock()
        mock_module.Daytona = MagicMock(return_value=mock_client)
        mock_module.DaytonaConfig = MagicMock()

        return mock_module, mock_sandbox

    @pytest.mark.asyncio
    async def test_exposed_urls_have_correct_structure(
        self, mock_httpx_client, mock_daytona_for_urls
    ):
        """Verify exposed URLs have name, url, and port fields."""
        mock_module, _ = mock_daytona_for_urls
        _daytona_sandboxes.clear()

        mock_spec_service = MagicMock()
        mock_spec_page = MagicMock()
        mock_spec_page.items = []
        mock_spec_service.search_sandbox_specs = AsyncMock(return_value=mock_spec_page)

        service = DaytonaSandboxService(
            user_id='test-user',
            sandbox_spec_service=mock_spec_service,
            api_key='test-key',
            api_url='https://app.daytona.io/api',
            target='eu',
            httpx_client=mock_httpx_client,
        )

        with patch.dict(sys.modules, {'daytona': mock_module}):
            sandbox_info = await service.start_sandbox()

            # Verify exposed URLs structure
            assert sandbox_info.exposed_urls is not None
            assert len(sandbox_info.exposed_urls) == 2

            # Find agent server URL
            agent_url = next(
                (u for u in sandbox_info.exposed_urls if u.name == AGENT_SERVER), None
            )
            assert agent_url is not None
            assert agent_url.port == DAYTONA_AGENT_SERVER_PORT
            assert 'https://' in agent_url.url
            assert str(DAYTONA_AGENT_SERVER_PORT) in agent_url.url

            # Find VSCode URL
            vscode_url = next(
                (u for u in sandbox_info.exposed_urls if u.name == 'vscode'), None
            )
            assert vscode_url is not None
            assert vscode_url.port == DAYTONA_VSCODE_PORT

    @pytest.mark.asyncio
    async def test_exposed_urls_compatible_with_frontend(
        self, mock_httpx_client, mock_daytona_for_urls
    ):
        """Verify URLs can be used by frontend proxy logic."""
        mock_module, _ = mock_daytona_for_urls
        _daytona_sandboxes.clear()

        mock_spec_service = MagicMock()
        mock_spec_page = MagicMock()
        mock_spec_page.items = []
        mock_spec_service.search_sandbox_specs = AsyncMock(return_value=mock_spec_page)

        service = DaytonaSandboxService(
            user_id='test-user',
            sandbox_spec_service=mock_spec_service,
            api_key='test-key',
            api_url='https://app.daytona.io/api',
            target='eu',
            httpx_client=mock_httpx_client,
        )

        with patch.dict(sys.modules, {'daytona': mock_module}):
            sandbox_info = await service.start_sandbox()

            # Frontend expects to find AGENT_SERVER in exposed_urls
            agent_urls = [
                u for u in sandbox_info.exposed_urls if u.name == AGENT_SERVER
            ]
            assert len(agent_urls) == 1

            # Frontend will use url field directly
            agent_url = agent_urls[0]
            assert isinstance(agent_url.url, str)
            assert agent_url.url.startswith('https://')

            # Frontend expects ExposedUrl model structure
            assert hasattr(agent_url, 'name')
            assert hasattr(agent_url, 'url')
            assert hasattr(agent_url, 'port')
