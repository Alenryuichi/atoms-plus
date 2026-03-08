# Team Mode Clarification Tests
"""
Unit tests for HITL requirement clarification module.

Tests cover:
- Pydantic models (ClarificationSession, ClarifyingQuestion, etc.)
- Ambiguity detection logic
- Question generation
- Assumption generation
- Requirements refinement
"""

from __future__ import annotations

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest

# Import models - should work without litellm
from atoms_plus.team_mode.clarification.models import (
    AmbiguityResult,
    AnswerType,
    Assumption,
    ClarificationConfig,
    ClarificationSession,
    ClarificationStatus,
    ClarifyingQuestion,
    QuestionCategory,
    QuestionOption,
    QuestionPriority,
    QuestionType,
    UserAnswer,
)


class TestClarificationModels:
    """Tests for Pydantic model validation and behavior."""

    def test_question_type_enum(self):
        """Test QuestionType enum values."""
        assert QuestionType.SINGLE_CHOICE == 'single-choice'
        assert QuestionType.MULTI_CHOICE == 'multi-choice'
        assert QuestionType.FREE_TEXT == 'free-text'
        assert QuestionType.RANGE == 'range'

    def test_question_category_enum(self):
        """Test QuestionCategory enum values."""
        assert QuestionCategory.DATA == 'data'
        assert QuestionCategory.UI == 'ui'
        assert QuestionCategory.BEHAVIOR == 'behavior'
        assert QuestionCategory.INTEGRATION == 'integration'
        assert QuestionCategory.CONSTRAINTS == 'constraints'

    def test_question_priority_enum(self):
        """Test QuestionPriority enum values."""
        assert QuestionPriority.CRITICAL == 'critical'
        assert QuestionPriority.IMPORTANT == 'important'
        assert QuestionPriority.NICE_TO_HAVE == 'nice-to-have'

    def test_clarification_status_enum(self):
        """Test ClarificationStatus enum values."""
        assert ClarificationStatus.PENDING == 'pending'
        assert ClarificationStatus.ANSWERED == 'answered'
        assert ClarificationStatus.SKIPPED == 'skipped'
        assert ClarificationStatus.COMPLETE == 'complete'

    def test_question_option_creation(self):
        """Test QuestionOption model creation."""
        option = QuestionOption(
            id='opt1',
            text='React + Vite',
            description='Modern React setup with Vite bundler',
        )
        assert option.id == 'opt1'
        assert option.text == 'React + Vite'
        assert option.description == 'Modern React setup with Vite bundler'

    def test_clarifying_question_creation(self):
        """Test ClarifyingQuestion model creation."""
        options = [
            QuestionOption(id='opt1', text='Supabase'),
            QuestionOption(id='opt2', text='External API'),
        ]
        question = ClarifyingQuestion(
            id='q1',
            question_text='Where does your data come from?',
            question_type=QuestionType.SINGLE_CHOICE,
            category=QuestionCategory.DATA,
            priority=QuestionPriority.CRITICAL,
            options=options,
            ai_suggestion='Supabase database',
        )
        assert question.id == 'q1'
        assert question.question_type == QuestionType.SINGLE_CHOICE
        assert len(question.options) == 2
        assert question.ai_suggestion == 'Supabase database'

    def test_user_answer_creation(self):
        """Test UserAnswer model creation."""
        answer = UserAnswer(
            question_id='q1',
            answer_type=AnswerType.SELECTED,
            selected_options=['opt1'],
        )
        assert answer.question_id == 'q1'
        assert answer.answer_type == AnswerType.SELECTED
        assert 'opt1' in answer.selected_options
        assert isinstance(answer.timestamp, datetime)

    def test_assumption_creation(self):
        """Test Assumption model creation."""
        assumption = Assumption(
            question_id='q1',
            assumed_value='Supabase database',
            confidence=85.0,
            reasoning='Most common pattern for modern web apps',
        )
        assert assumption.question_id == 'q1'
        assert assumption.confidence == 85.0

    def test_assumption_confidence_validation(self):
        """Test Assumption confidence must be 0-100."""
        with pytest.raises(ValueError):
            Assumption(
                question_id='q1',
                assumed_value='test',
                confidence=150.0,  # Invalid: > 100
                reasoning='test',
            )

    def test_ambiguity_result_creation(self):
        """Test AmbiguityResult model creation."""
        result = AmbiguityResult(
            score=65.5,
            is_ambiguous=True,
            ambiguous_aspects=['Data source unclear', 'UI style not specified'],
            interpretations=['Build a todo app with React', 'Build a todo CLI'],
            similarity_scores=[0.3, 0.4, 0.35],
        )
        assert result.score == 65.5
        assert result.is_ambiguous is True
        assert len(result.ambiguous_aspects) == 2
        assert len(result.interpretations) == 2

    def test_clarification_session_creation(self):
        """Test ClarificationSession model creation."""
        session = ClarificationSession(
            id='clarify_abc123',
            conversation_id='conv_xyz',
            original_input='Build a dashboard',
            ambiguity_score=55.0,
            questions=[],
            status=ClarificationStatus.PENDING,
        )
        assert session.id == 'clarify_abc123'
        assert session.status == ClarificationStatus.PENDING
        assert session.current_round == 1
        assert session.max_rounds == 3

    def test_clarification_config_defaults(self):
        """Test ClarificationConfig default values."""
        config = ClarificationConfig()
        assert config.ambiguity_threshold == 40.0
        assert config.max_questions_per_round == 4
        assert config.max_rounds == 3
        assert config.num_interpretations == 3
        assert config.enable_skip is True
        assert config.auto_proceed_threshold == 20.0

    def test_clarification_config_custom(self):
        """Test ClarificationConfig with custom values."""
        config = ClarificationConfig(
            ambiguity_threshold=60.0,
            max_questions_per_round=2,
            max_rounds=5,
            num_interpretations=5,
            enable_skip=False,
        )
        assert config.ambiguity_threshold == 60.0
        assert config.max_questions_per_round == 2
        assert config.max_rounds == 5
        assert config.num_interpretations == 5
        assert config.enable_skip is False


class TestGeneratorHelpers:
    """Tests for generator helper functions."""

    def test_generate_assumptions_from_questions(self):
        """Test generating assumptions from questions."""
        from atoms_plus.team_mode.clarification.generator import (
            generate_assumptions_from_questions,
        )

        questions = [
            ClarifyingQuestion(
                id='q1',
                question_text='Where does data come from?',
                question_type=QuestionType.SINGLE_CHOICE,
                category=QuestionCategory.DATA,
                priority=QuestionPriority.CRITICAL,
                ai_suggestion='Supabase database',
            ),
            ClarifyingQuestion(
                id='q2',
                question_text='What UI framework?',
                question_type=QuestionType.SINGLE_CHOICE,
                category=QuestionCategory.UI,
                priority=QuestionPriority.IMPORTANT,
                ai_suggestion='shadcn/ui components',
            ),
        ]

        assumptions = generate_assumptions_from_questions(questions)

        assert len(assumptions) == 2
        assert assumptions[0].question_id == 'q1'
        assert assumptions[0].assumed_value == 'Supabase database'
        assert assumptions[0].confidence == 70.0
        assert assumptions[1].question_id == 'q2'
        assert assumptions[1].assumed_value == 'shadcn/ui components'

    def test_create_clarification_session(self):
        """Test creating a clarification session."""
        from atoms_plus.team_mode.clarification.generator import (
            create_clarification_session,
        )

        ambiguity_result = AmbiguityResult(
            score=55.0,
            is_ambiguous=True,
            ambiguous_aspects=['Data source unclear'],
        )

        questions = [
            ClarifyingQuestion(
                id='q1',
                question_text='Where does data come from?',
                question_type=QuestionType.SINGLE_CHOICE,
                category=QuestionCategory.DATA,
                priority=QuestionPriority.CRITICAL,
            ),
        ]

        session = create_clarification_session(
            conversation_id='conv_123',
            user_input='Build a dashboard',
            ambiguity_result=ambiguity_result,
            questions=questions,
        )

        assert session.conversation_id == 'conv_123'
        assert session.original_input == 'Build a dashboard'
        assert session.ambiguity_score == 55.0
        assert len(session.questions) == 1
        assert session.status == ClarificationStatus.PENDING
        assert session.id.startswith('clarify_')


class TestDetectorHelpers:
    """Tests for detector helper functions that don't require LLM."""

    @pytest.mark.asyncio
    async def test_calculate_pairwise_similarity_single(self):
        """Test pairwise similarity with single interpretation."""
        from atoms_plus.team_mode.clarification.detector import (
            calculate_pairwise_similarity,
        )

        # Mock the calculate_similarity function
        with patch(
            'atoms_plus.team_mode.clarification.detector.calculate_similarity'
        ) as mock_sim:
            mock_sim.return_value = 0.8

            avg, scores = await calculate_pairwise_similarity([{'interp': 'one'}])

            # Single interpretation should return 1.0
            assert avg == 1.0
            assert scores == [1.0]

    @pytest.mark.asyncio
    async def test_calculate_pairwise_similarity_multiple(self):
        """Test pairwise similarity with multiple interpretations."""
        from atoms_plus.team_mode.clarification.detector import (
            calculate_pairwise_similarity,
        )

        # Mock the calculate_similarity function
        with patch(
            'atoms_plus.team_mode.clarification.detector.calculate_similarity',
            new_callable=AsyncMock,
        ) as mock_sim:
            # 3 interpretations = 3 pairs
            mock_sim.side_effect = [0.6, 0.7, 0.8]

            interpretations = [
                {'interp': 'one'},
                {'interp': 'two'},
                {'interp': 'three'},
            ]

            avg, scores = await calculate_pairwise_similarity(interpretations)

            # Average of [0.6, 0.7, 0.8] = 0.7
            assert avg == pytest.approx(0.7, rel=1e-2)
            assert len(scores) == 3
            assert mock_sim.call_count == 3


class TestAmbiguityScoreCalculation:
    """Tests for ambiguity score calculation logic."""

    def test_high_similarity_low_ambiguity(self):
        """High similarity should result in low ambiguity score."""
        similarity = 0.9  # Very similar interpretations
        ambiguity_score = (1 - similarity) * 100
        assert ambiguity_score == pytest.approx(10.0, rel=1e-5)
        assert ambiguity_score < 40  # Below default threshold

    def test_low_similarity_high_ambiguity(self):
        """Low similarity should result in high ambiguity score."""
        similarity = 0.3  # Very different interpretations
        ambiguity_score = (1 - similarity) * 100
        assert ambiguity_score == 70.0
        assert ambiguity_score > 40  # Above default threshold

    def test_threshold_boundary(self):
        """Test ambiguity at threshold boundary."""
        config = ClarificationConfig(ambiguity_threshold=40.0)

        # Just below threshold - not ambiguous
        similarity_39 = 0.61
        score_39 = (1 - similarity_39) * 100
        assert score_39 < config.ambiguity_threshold

        # Just above threshold - ambiguous
        similarity_41 = 0.59
        score_41 = (1 - similarity_41) * 100
        assert score_41 > config.ambiguity_threshold


class TestClarificationNodes:
    """Tests for clarification graph nodes."""

    def test_should_clarify_returns_clarify(self):
        """Test should_clarify returns 'clarify' when clarification is required."""
        from atoms_plus.team_mode.nodes.clarification import should_clarify

        state = {
            'clarification_required': True,
            'task': 'Build something',
        }
        assert should_clarify(state) == 'clarify'

    def test_should_clarify_returns_proceed(self):
        """Test should_clarify returns 'proceed' when no clarification needed."""
        from atoms_plus.team_mode.nodes.clarification import should_clarify

        state = {
            'clarification_required': False,
            'task': 'Build something',
        }
        assert should_clarify(state) == 'proceed'

    def test_should_refine_returns_skip(self):
        """Test should_refine returns 'skip' when user skipped."""
        from atoms_plus.team_mode.nodes.clarification import should_refine

        state = {
            'clarification_skipped': True,
        }
        assert should_refine(state) == 'skip'

    def test_should_refine_returns_refine(self):
        """Test should_refine returns 'refine' when user answered."""
        from atoms_plus.team_mode.nodes.clarification import should_refine

        state = {
            'clarification_skipped': False,
        }
        assert should_refine(state) == 'refine'


class TestTeamStateWithClarification:
    """Tests for extended TeamState with clarification fields."""

    def test_create_initial_state_has_clarification_fields(self):
        """Test initial state includes clarification fields."""
        from atoms_plus.team_mode.state import create_initial_state

        state = create_initial_state(
            task='Build a dashboard',
            session_id='session_123',
            user_id='user_456',
        )

        assert state['clarification_session'] is None
        assert state['clarification_required'] is False
        assert state['clarification_skipped'] is False
        assert state['refined_requirements'] is None

    def test_state_can_store_clarification_session(self):
        """Test state can store serialized clarification session."""
        from atoms_plus.team_mode.state import create_initial_state

        state = create_initial_state(
            task='Build a dashboard',
            session_id='session_123',
            user_id='user_456',
        )

        # Simulate storing a clarification session
        state['clarification_session'] = {
            'id': 'clarify_abc123',
            'conversation_id': 'session_123',
            'original_input': 'Build a dashboard',
            'ambiguity_score': 55.0,
            'questions': [],
            'answers': [],
            'assumptions': [],
            'status': 'pending',
        }
        state['clarification_required'] = True

        assert state['clarification_session']['id'] == 'clarify_abc123'
        assert state['clarification_required'] is True


class TestGraphWithClarification:
    """Tests for graph with clarification nodes."""

    def test_create_graph_with_clarification(self):
        """Test graph creation includes clarification nodes."""
        from atoms_plus.team_mode.graph import create_team_graph

        graph = create_team_graph(enable_clarification=True)

        # Check that clarification nodes are present
        assert 'pm_detect_ambiguity' in graph.nodes
        assert 'pm_await_clarification' in graph.nodes
        assert 'pm_refine_requirements' in graph.nodes

    def test_create_graph_without_clarification(self):
        """Test graph creation without clarification nodes (legacy)."""
        from atoms_plus.team_mode.graph import create_team_graph

        graph = create_team_graph(enable_clarification=False)

        # Check that clarification nodes are NOT present
        assert 'pm_detect_ambiguity' not in graph.nodes
        assert 'pm_await_clarification' not in graph.nodes
        assert 'pm_refine_requirements' not in graph.nodes

        # But main nodes should still be there
        assert 'pm' in graph.nodes
        assert 'architect' in graph.nodes
        assert 'engineer' in graph.nodes

    def test_compile_graph_with_clarification(self):
        """Test graph compilation with clarification enabled."""
        from atoms_plus.team_mode.graph import compile_team_graph

        compiled = compile_team_graph(enable_clarification=True)

        # Should compile without errors
        assert compiled is not None
