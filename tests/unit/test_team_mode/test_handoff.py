# Tests for atoms_plus.team_mode.nodes.handoff
"""Unit tests for Team Mode handoff to OpenHands CodeActAgent."""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from atoms_plus.team_mode.nodes.handoff import (
    format_handoff_message,
    handoff_to_openhands,
    send_message_to_openhands,
)
from atoms_plus.team_mode.state import ExecutionMode, create_initial_state


class TestFormatHandoffMessage:
    """Tests for formatting handoff messages."""

    def test_formats_basic_task(self):
        """Should format a basic task into handoff message."""
        state = create_initial_state('Build a REST API', 's1', 'u1')
        message = format_handoff_message(state)

        assert '## 🚀 Team Mode Handoff' in message
        assert 'Build a REST API' in message
        assert '### Original Task' in message
        assert '### Instructions' in message

    def test_includes_plan_when_present(self):
        """Should include architecture plan if present."""
        state = create_initial_state('Build API', 's1', 'u1')
        state['plan'] = 'Use FastAPI with SQLAlchemy'

        message = format_handoff_message(state)

        assert '### Architecture Plan' in message
        assert 'Use FastAPI with SQLAlchemy' in message

    def test_includes_code_when_present(self):
        """Should include implementation code if present."""
        state = create_initial_state('Build API', 's1', 'u1')
        state['code'] = 'def hello(): return "world"'

        message = format_handoff_message(state)

        assert '### Implementation Code' in message
        assert 'def hello()' in message

    def test_includes_review_when_present(self):
        """Should include review notes if present."""
        state = create_initial_state('Build API', 's1', 'u1')
        state['review'] = 'LGTM, code looks good'

        message = format_handoff_message(state)

        assert '### Code Review Notes' in message
        assert 'LGTM' in message

    def test_complete_message_with_all_sections(self):
        """Should format complete message with all sections."""
        state = create_initial_state('Build API', 's1', 'u1')
        state['plan'] = 'Architecture plan here'
        state['code'] = 'Code implementation here'
        state['review'] = 'Review notes here'

        message = format_handoff_message(state)

        assert '### Original Task' in message
        assert '### Architecture Plan' in message
        assert '### Implementation Code' in message
        assert '### Code Review Notes' in message
        assert '### Instructions' in message


class TestSendMessageToOpenhands:
    """Tests for HTTP communication with OpenHands."""

    @pytest.mark.asyncio
    async def test_sends_correct_request(self):
        """Should send correct HTTP request to OpenHands API."""
        mock_response = MagicMock()
        mock_response.json.return_value = {'status': 'ok'}
        mock_response.raise_for_status = MagicMock()

        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__ = AsyncMock(
                return_value=mock_client
            )
            mock_client_class.return_value.__aexit__ = AsyncMock(return_value=None)

            result = await send_message_to_openhands(
                sandbox_url='http://localhost:8003',
                conversation_id='conv-123',
                session_api_key='api-key-456',
                message='Test message',
            )

            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert (
                call_args[0][0]
                == 'http://localhost:8003/api/conversations/conv-123/events'
            )
            assert call_args[1]['json'] == {'message': 'Test message'}
            assert call_args[1]['headers']['X-Session-API-Key'] == 'api-key-456'
            assert result == {'status': 'ok'}

    @pytest.mark.asyncio
    async def test_raises_on_http_error(self):
        """Should raise HTTPStatusError on non-2xx response."""
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            'Server error', request=MagicMock(), response=MagicMock(status_code=500)
        )

        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__ = AsyncMock(
                return_value=mock_client
            )
            mock_client_class.return_value.__aexit__ = AsyncMock(return_value=None)

            with pytest.raises(httpx.HTTPStatusError):
                await send_message_to_openhands(
                    sandbox_url='http://localhost:8003',
                    conversation_id='conv-123',
                    session_api_key='api-key',
                    message='Test',
                )


class TestHandoffToOpenhands:
    """Tests for the handoff node."""

    @pytest.mark.asyncio
    async def test_skips_when_plan_only_mode(self):
        """Should skip handoff when execution_mode is plan_only."""
        state = create_initial_state('Test', 's1', 'u1')
        state['execution_mode'] = ExecutionMode.PLAN_ONLY.value

        result = await handoff_to_openhands(state)

        # State should be unchanged
        assert result == state

    @pytest.mark.asyncio
    async def test_errors_when_sandbox_info_missing(self):
        """Should record error when sandbox info is incomplete."""
        state = create_initial_state('Test', 's1', 'u1')
        state['execution_mode'] = ExecutionMode.EXECUTE.value
        state['conversation_id'] = 'conv-123'
        state['sandbox_url'] = None  # Missing!
        state['sandbox_api_key'] = 'key'

        result = await handoff_to_openhands(state)

        assert result['error'] == 'Missing sandbox information for code execution'
        assert len(result['thoughts']) == 1
        assert 'Cannot execute code' in result['thoughts'][0]['content']

    @pytest.mark.asyncio
    async def test_successful_handoff(self):
        """Should successfully hand off to OpenHands."""
        state = create_initial_state('Test', 's1', 'u1')
        state['execution_mode'] = ExecutionMode.EXECUTE.value
        state['conversation_id'] = 'conv-123'
        state['sandbox_url'] = 'http://localhost:8003'
        state['sandbox_api_key'] = 'api-key'
        state['plan'] = 'Test plan'
        state['code'] = 'print("hello")'

        with patch(
            'atoms_plus.team_mode.nodes.handoff.send_message_to_openhands'
        ) as mock_send:
            mock_send.return_value = {'status': 'accepted'}

            result = await handoff_to_openhands(state)

            mock_send.assert_called_once()
            assert result['handoff_message'] is not None
            assert 'Test plan' in result['handoff_message']
            assert result.get('error') is None

    @pytest.mark.asyncio
    async def test_handles_http_error(self):
        """Should handle HTTP errors gracefully."""
        state = create_initial_state('Test', 's1', 'u1')
        state['execution_mode'] = ExecutionMode.EXECUTE.value
        state['conversation_id'] = 'conv-123'
        state['sandbox_url'] = 'http://localhost:8003'
        state['sandbox_api_key'] = 'api-key'

        mock_response = MagicMock()
        mock_response.status_code = 500

        with patch(
            'atoms_plus.team_mode.nodes.handoff.send_message_to_openhands'
        ) as mock_send:
            mock_send.side_effect = httpx.HTTPStatusError(
                'Server error', request=MagicMock(), response=mock_response
            )

            result = await handoff_to_openhands(state)

            assert 'HTTP 500' in result['error']

    @pytest.mark.asyncio
    async def test_handles_timeout(self):
        """Should handle request timeout gracefully."""
        state = create_initial_state('Test', 's1', 'u1')
        state['execution_mode'] = ExecutionMode.EXECUTE.value
        state['conversation_id'] = 'conv-123'
        state['sandbox_url'] = 'http://localhost:8003'
        state['sandbox_api_key'] = 'api-key'

        with patch(
            'atoms_plus.team_mode.nodes.handoff.send_message_to_openhands'
        ) as mock_send:
            mock_send.side_effect = httpx.TimeoutException('Timeout')

            result = await handoff_to_openhands(state)

            assert 'timeout' in result['error'].lower()
