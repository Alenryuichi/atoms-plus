# Atoms Plus - Clarification Module
"""
Human-in-the-Loop Requirement Clarification for Team Mode.

This module implements ClarifyGPT-inspired ambiguity detection and
targeted question generation to ensure requirements are clear before
code generation begins.

Key Features:
- Ambiguity detection via multi-interpretation comparison
- Targeted clarifying questions (max 4 per round)
- Skip option with AI assumptions
- Multi-round clarification support
- Refined requirements output

Usage:
    from atoms_plus.team_mode.clarification import (
        detect_ambiguity,
        generate_questions,
        refine_requirements,
        ClarificationConfig,
        ClarificationSession,
    )

    # Detect ambiguity
    result = await detect_ambiguity(user_input, config)

    if result.is_ambiguous:
        # Generate questions
        questions = await generate_questions(
            user_input,
            result.ambiguous_aspects,
            config,
        )

        # Create session for tracking
        session = create_clarification_session(
            conversation_id, user_input, result, questions, config
        )
"""

from atoms_plus.team_mode.clarification.detector import (
    calculate_pairwise_similarity,
    detect_ambiguity,
    generate_interpretations,
    identify_ambiguous_aspects,
)
from atoms_plus.team_mode.clarification.generator import (
    create_clarification_session,
    generate_assumptions_from_questions,
    generate_questions,
    refine_requirements,
)
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

__all__ = [
    # Detector
    'detect_ambiguity',
    'generate_interpretations',
    'calculate_pairwise_similarity',
    'identify_ambiguous_aspects',
    # Generator
    'generate_questions',
    'generate_assumptions_from_questions',
    'refine_requirements',
    'create_clarification_session',
    # Models
    'AmbiguityResult',
    'ClarificationSession',
    'ClarificationConfig',
    'ClarifyingQuestion',
    'QuestionOption',
    'QuestionType',
    'QuestionCategory',
    'QuestionPriority',
    'UserAnswer',
    'AnswerType',
    'Assumption',
    'ClarificationStatus',
]
