"""Tests for DaytonaSandboxService."""

import os
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


class MockSandboxSpec:
    """Mock sandbox specification."""

    def __init__(self):
        self.id = 'test-spec'
        self.initial_env = {'TEST_VAR': 'test_value'}


class MockSandboxSpecService:
    """Mock sandbox spec service."""

    async def search_sandbox_specs(self):
        return [MockSandboxSpec()]

    async def get_default_sandbox_spec(self):
        return MockSandboxSpec()

    async def get_sandbox_spec(self, spec_id: str):
        if spec_id == 'test-spec':
            return MockSandboxSpec()
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
