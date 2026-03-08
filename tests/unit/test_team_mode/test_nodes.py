# Tests for atoms_plus.team_mode.nodes
"""Unit tests for Team Mode agent nodes."""

from unittest.mock import AsyncMock, patch

import pytest

from atoms_plus.team_mode.nodes.architect import architect_node
from atoms_plus.team_mode.nodes.base import (
    AgentRole,
    AgentStatus,
    create_thought,
    update_state_with_thought,
)
from atoms_plus.team_mode.nodes.engineer import engineer_node
from atoms_plus.team_mode.nodes.pm import pm_node
from atoms_plus.team_mode.state import create_initial_state


class TestCreateThought:
    """Tests for thought creation utility."""

    def test_creates_thought_with_defaults(self):
        """Should create thought with default status."""
        thought = create_thought(AgentRole.ARCHITECT, 'Analyzing...')

        assert thought['role'] == 'architect'
        assert thought['content'] == 'Analyzing...'
        assert thought['status'] == 'thinking'
        assert 'timestamp' in thought
        assert thought['metadata'] == {}

    def test_creates_thought_with_custom_status(self):
        """Should accept custom status."""
        thought = create_thought(
            AgentRole.ENGINEER,
            'Done!',
            status=AgentStatus.RESPONDING,
        )

        assert thought['status'] == 'responding'

    def test_creates_thought_with_metadata(self):
        """Should accept metadata dict."""
        thought = create_thought(
            AgentRole.PM,
            'Planning...',
            metadata={'confidence': 0.9},
        )

        assert thought['metadata']['confidence'] == 0.9


class TestUpdateStateWithThought:
    """Tests for state update utility."""

    def test_adds_thought_to_state(self):
        """Should add thought to state's thoughts list."""
        state = create_initial_state('Test', 's1', 'u1')
        new_state = update_state_with_thought(
            state,
            AgentRole.ARCHITECT,
            'Thinking about architecture...',
        )

        assert len(new_state['thoughts']) == 1
        assert new_state['thoughts'][0]['role'] == 'architect'

    def test_updates_current_agent(self):
        """Should update current_agent field."""
        state = create_initial_state('Test', 's1', 'u1')
        new_state = update_state_with_thought(
            state,
            AgentRole.ENGINEER,
            'Writing code...',
        )

        assert new_state['current_agent'] == 'engineer'

    def test_updates_agent_status(self):
        """Should update agent's status in agent_statuses."""
        state = create_initial_state('Test', 's1', 'u1')
        new_state = update_state_with_thought(
            state,
            AgentRole.PM,
            'Analyzing requirements...',
            AgentStatus.THINKING,
        )

        assert new_state['agent_statuses']['pm'] == 'thinking'


class TestArchitectNode:
    """Tests for Architect agent node."""

    @pytest.mark.asyncio
    async def test_architect_updates_state(self):
        """Architect should update state with plan."""
        state = create_initial_state('Design a microservices architecture', 's1', 'u1')

        with patch(
            'atoms_plus.team_mode.nodes.architect.call_llm',
            new_callable=AsyncMock,
            return_value='Here is the architecture plan...',
        ):
            result = await architect_node(state)

        assert result['plan'] == 'Here is the architecture plan...'
        assert len(result['thoughts']) > 0

    @pytest.mark.asyncio
    async def test_architect_handles_code_review(self):
        """Architect should review code when present."""
        state = create_initial_state('Review this code', 's1', 'u1')
        state['code'] = 'def hello(): pass'

        with patch(
            'atoms_plus.team_mode.nodes.architect.call_llm',
            new_callable=AsyncMock,
            return_value='Code review feedback...',
        ):
            result = await architect_node(state)

        assert result['review'] == 'Code review feedback...'


class TestEngineerNode:
    """Tests for Engineer agent node."""

    @pytest.mark.asyncio
    async def test_engineer_generates_code(self):
        """Engineer should generate code based on plan."""
        state = create_initial_state('Implement a REST API', 's1', 'u1')
        state['plan'] = 'Create FastAPI endpoints for CRUD operations.'

        with patch(
            'atoms_plus.team_mode.nodes.engineer.call_llm',
            new_callable=AsyncMock,
            return_value='from fastapi import FastAPI\napp = FastAPI()',
        ):
            result = await engineer_node(state)

        assert 'FastAPI' in result['code']


class TestPmNode:
    """Tests for PM agent node."""

    @pytest.mark.asyncio
    async def test_pm_analyzes_requirements(self):
        """PM should analyze task and add to messages."""
        state = create_initial_state('Build a user authentication system', 's1', 'u1')

        with patch(
            'atoms_plus.team_mode.nodes.pm.call_llm',
            new_callable=AsyncMock,
            return_value='## User Stories\n- As a user, I want to login...',
        ):
            result = await pm_node(state)

        assert len(result['messages']) > 0
        assert 'PM Analysis' in result['messages'][-1]['content']
