# Tests for atoms_plus.team_mode.state
"""Unit tests for Team Mode state management."""

from atoms_plus.team_mode.state import (
    AgentRole,
    AgentStatus,
    create_initial_state,
)


class TestAgentRole:
    """Tests for AgentRole enum."""

    def test_mvp_roles_exist(self):
        """MVP roles should be defined."""
        assert AgentRole.ARCHITECT.value == 'architect'
        assert AgentRole.ENGINEER.value == 'engineer'
        assert AgentRole.PM.value == 'pm'

    def test_future_roles_exist(self):
        """Future roles should be defined for Phase 2."""
        assert AgentRole.DATA_ANALYST.value == 'data_analyst'
        assert AgentRole.RESEARCHER.value == 'researcher'
        assert AgentRole.PROJECT_MANAGER.value == 'project_manager'
        assert AgentRole.SEO_SPECIALIST.value == 'seo_specialist'
        assert AgentRole.TEAM_LEADER.value == 'team_leader'


class TestAgentStatus:
    """Tests for AgentStatus enum."""

    def test_all_statuses_exist(self):
        """All expected statuses should be defined."""
        assert AgentStatus.IDLE.value == 'idle'
        assert AgentStatus.THINKING.value == 'thinking'
        assert AgentStatus.ACTING.value == 'acting'
        assert AgentStatus.RESPONDING.value == 'responding'
        assert AgentStatus.WAITING.value == 'waiting'
        assert AgentStatus.ERROR.value == 'error'


class TestCreateInitialState:
    """Tests for create_initial_state function."""

    def test_creates_valid_state(self):
        """Should create a valid TeamState with all required fields."""
        state = create_initial_state(
            task='Build a REST API',
            session_id='test-session-123',
            user_id='user-456',
        )

        assert state['task'] == 'Build a REST API'
        assert state['session_id'] == 'test-session-123'
        assert state['user_id'] == 'user-456'
        assert state['model'] == 'qwen-plus'  # default
        assert state['max_iterations'] == 3  # default

    def test_custom_model_and_iterations(self):
        """Should accept custom model and max_iterations."""
        state = create_initial_state(
            task='Test task',
            session_id='s1',
            user_id='u1',
            model='gpt-4o',
            max_iterations=5,
        )

        assert state['model'] == 'gpt-4o'
        assert state['max_iterations'] == 5

    def test_initial_state_has_empty_work_products(self):
        """Initial state should have no work products."""
        state = create_initial_state(
            task='Test',
            session_id='s1',
            user_id='u1',
        )

        assert state['plan'] is None
        assert state['code'] is None
        assert state['review'] is None
        assert state['error'] is None

    def test_initial_state_has_empty_collections(self):
        """Initial state should have empty lists/dicts."""
        state = create_initial_state(
            task='Test',
            session_id='s1',
            user_id='u1',
        )

        assert state['messages'] == []
        assert state['thoughts'] == []
        assert state['agent_statuses'] == {}
        assert state['current_agent'] == ''
        assert state['iteration'] == 0
