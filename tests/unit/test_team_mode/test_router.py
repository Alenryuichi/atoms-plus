# Tests for atoms_plus.team_mode.router
"""Unit tests for Team Mode routing logic."""

from atoms_plus.team_mode.router import (
    check_for_error,
    route_initial_task,
    should_continue_after_review,
    should_handoff,
)
from atoms_plus.team_mode.state import ExecutionMode, create_initial_state


class TestShouldContinueAfterReview:
    """Tests for review-based routing decisions."""

    def test_completes_when_max_iterations_reached(self):
        """Should complete when max iterations is reached."""
        state = create_initial_state('Test', 's1', 'u1', max_iterations=3)
        state['iteration'] = 3
        state['review'] = 'This has critical issues'

        result = should_continue_after_review(state)
        assert result == 'complete'

    def test_revises_on_critical_issue(self):
        """Should request revision when review mentions critical issues."""
        state = create_initial_state('Test', 's1', 'u1')
        state['iteration'] = 1
        state['review'] = 'There is a critical issue with the architecture.'

        result = should_continue_after_review(state)
        assert result == 'revise'

    def test_revises_on_needs_revision(self):
        """Should request revision when review says needs revision."""
        state = create_initial_state('Test', 's1', 'u1')
        state['iteration'] = 1
        state['review'] = 'The code needs revision to handle edge cases.'

        result = should_continue_after_review(state)
        assert result == 'revise'

    def test_revises_on_chinese_keywords(self):
        """Should handle Chinese review keywords."""
        state = create_initial_state('Test', 's1', 'u1')
        state['iteration'] = 1
        state['review'] = '这个实现有重大问题，需要修改。'

        result = should_continue_after_review(state)
        assert result == 'revise'

    def test_completes_on_approval(self):
        """Should complete when review approves."""
        state = create_initial_state('Test', 's1', 'u1')
        state['iteration'] = 1
        state['review'] = 'LGTM! The implementation looks good.'

        result = should_continue_after_review(state)
        assert result == 'complete'

    def test_completes_on_chinese_approval(self):
        """Should handle Chinese approval keywords."""
        state = create_initial_state('Test', 's1', 'u1')
        state['iteration'] = 1
        state['review'] = '代码设计良好，没有问题。'

        result = should_continue_after_review(state)
        assert result == 'complete'

    def test_completes_by_default(self):
        """Should complete when no strong signals either way."""
        state = create_initial_state('Test', 's1', 'u1')
        state['iteration'] = 1
        state['review'] = "The code does what it's supposed to do."

        result = should_continue_after_review(state)
        assert result == 'complete'


class TestRouteInitialTask:
    """Tests for initial task routing."""

    def test_routes_feature_to_pm(self):
        """Feature requests should go to PM."""
        state = create_initial_state('Add a new feature for user login', 's1', 'u1')
        assert route_initial_task(state) == 'pm'

    def test_routes_requirement_to_pm(self):
        """Requirement tasks should go to PM."""
        state = create_initial_state('Define the requirements for the API', 's1', 'u1')
        assert route_initial_task(state) == 'pm'

    def test_routes_chinese_feature_to_pm(self):
        """Chinese feature requests should go to PM."""
        state = create_initial_state('实现一个新功能', 's1', 'u1')
        assert route_initial_task(state) == 'pm'

    def test_routes_technical_to_architect(self):
        """Technical tasks should go to Architect."""
        state = create_initial_state('Optimize database queries', 's1', 'u1')
        assert route_initial_task(state) == 'architect'

    def test_routes_code_task_to_architect(self):
        """Code-focused tasks should go to Architect."""
        state = create_initial_state('Refactor the authentication module', 's1', 'u1')
        assert route_initial_task(state) == 'architect'


class TestCheckForError:
    """Tests for error checking."""

    def test_returns_error_when_error_exists(self):
        """Should return 'error' when state has error."""
        state = create_initial_state('Test', 's1', 'u1')
        state['error'] = 'Something went wrong'

        assert check_for_error(state) == 'error'

    def test_returns_continue_when_no_error(self):
        """Should return 'continue' when no error."""
        state = create_initial_state('Test', 's1', 'u1')
        assert check_for_error(state) == 'continue'


class TestShouldHandoff:
    """Tests for handoff routing decisions."""

    def test_returns_end_when_plan_only_mode(self):
        """Should return 'end' when execution_mode is plan_only."""
        state = create_initial_state('Test', 's1', 'u1')
        state['execution_mode'] = ExecutionMode.PLAN_ONLY.value

        result = should_handoff(state)
        assert result == 'end'

    def test_returns_end_when_no_execution_mode(self):
        """Should return 'end' when execution_mode is not set."""
        state = create_initial_state('Test', 's1', 'u1')
        # execution_mode defaults to plan_only

        result = should_handoff(state)
        assert result == 'end'

    def test_returns_handoff_when_execute_mode_with_sandbox(self):
        """Should return 'handoff' when execute mode and sandbox info present."""
        state = create_initial_state(
            'Test',
            's1',
            'u1',
            conversation_id='conv-123',
            sandbox_url='http://localhost:8003',
            sandbox_api_key='api-key',
            execution_mode=ExecutionMode.EXECUTE.value,
        )

        result = should_handoff(state)
        assert result == 'handoff'

    def test_returns_end_when_execute_mode_but_missing_conversation_id(self):
        """Should return 'end' when execute mode but no conversation_id."""
        state = create_initial_state('Test', 's1', 'u1')
        state['execution_mode'] = ExecutionMode.EXECUTE.value
        state['sandbox_url'] = 'http://localhost:8003'
        state['sandbox_api_key'] = 'api-key'
        state['conversation_id'] = None

        result = should_handoff(state)
        assert result == 'end'

    def test_returns_end_when_execute_mode_but_missing_sandbox_url(self):
        """Should return 'end' when execute mode but no sandbox_url."""
        state = create_initial_state('Test', 's1', 'u1')
        state['execution_mode'] = ExecutionMode.EXECUTE.value
        state['conversation_id'] = 'conv-123'
        state['sandbox_api_key'] = 'api-key'
        state['sandbox_url'] = None

        result = should_handoff(state)
        assert result == 'end'

    def test_returns_end_when_execute_mode_but_missing_api_key(self):
        """Should return 'end' when execute mode but no sandbox_api_key."""
        state = create_initial_state('Test', 's1', 'u1')
        state['execution_mode'] = ExecutionMode.EXECUTE.value
        state['conversation_id'] = 'conv-123'
        state['sandbox_url'] = 'http://localhost:8003'
        state['sandbox_api_key'] = None

        result = should_handoff(state)
        assert result == 'end'
