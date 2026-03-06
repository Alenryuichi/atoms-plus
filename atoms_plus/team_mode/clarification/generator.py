# Atoms Plus - Question Generator
"""
Generate targeted clarifying questions based on detected ambiguity.

Features:
- Maximum 4 questions per round (configurable)
- Support for single-choice, multi-choice, free-text question types
- Questions categorized by: data, ui, behavior, integration, constraints
- AI suggestions for what would be assumed if user skips
"""

from __future__ import annotations

import json
import logging
import uuid

from atoms_plus.team_mode.clarification.models import (
    AmbiguityResult,
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
from atoms_plus.team_mode.clarification.prompts import (
    QUESTION_GENERATION_PROMPT,
    REFINE_REQUIREMENTS_PROMPT,
)
from atoms_plus.team_mode.nodes.base import get_llm_config

logger = logging.getLogger(__name__)

try:
    from litellm import acompletion
except ImportError:
    acompletion = None


async def generate_questions(
    user_input: str,
    ambiguous_aspects: list[str],
    config: ClarificationConfig | None = None,
    model: str | None = None,
) -> list[ClarifyingQuestion]:
    """
    Generate clarifying questions based on ambiguous aspects.

    Args:
        user_input: Original user requirement
        ambiguous_aspects: List of identified ambiguous aspects
        config: Optional configuration overrides
        model: Optional model override

    Returns:
        List of ClarifyingQuestion objects (max 4 by default)
    """
    if config is None:
        config = ClarificationConfig()

    llm_config = get_llm_config()

    aspects_text = '\n'.join([f'- {aspect}' for aspect in ambiguous_aspects])

    prompt = QUESTION_GENERATION_PROMPT.format(
        user_input=user_input,
        ambiguous_aspects=aspects_text,
        max_questions=config.max_questions_per_round,
    )

    try:
        response = await acompletion(
            model=model or llm_config['model'],
            messages=[{'role': 'user', 'content': prompt}],
            api_base=llm_config['api_base'],
            api_key=llm_config['api_key'],
            temperature=0.5,
            max_tokens=2048,
        )
        content = response.choices[0].message.content

        # Parse JSON response
        questions_data = json.loads(content)

        questions = []
        for q_data in questions_data[: config.max_questions_per_round]:
            options = [
                QuestionOption(
                    id=opt.get('id', f'opt_{i}'),
                    text=opt.get('text', ''),
                    description=opt.get('description'),
                )
                for i, opt in enumerate(q_data.get('options', []))
            ]

            question = ClarifyingQuestion(
                id=q_data.get('id', f'q_{uuid.uuid4().hex[:8]}'),
                question_text=q_data.get('question_text', ''),
                question_type=QuestionType(
                    q_data.get('question_type', 'single-choice')
                ),
                category=QuestionCategory(q_data.get('category', 'behavior')),
                priority=QuestionPriority(q_data.get('priority', 'important')),
                options=options,
                ai_suggestion=q_data.get('ai_suggestion'),
            )
            questions.append(question)

        logger.info(f'[Generator] Generated {len(questions)} clarifying questions')
        return questions

    except Exception as e:
        logger.error(f'[Generator] Failed to generate questions: {e}')
        # Return a single fallback question
        return [
            ClarifyingQuestion(
                id='fallback_q1',
                question_text='Could you provide more details about what you want to build?',
                question_type=QuestionType.FREE_TEXT,
                category=QuestionCategory.BEHAVIOR,
                priority=QuestionPriority.CRITICAL,
                options=[],
                ai_suggestion='I will make reasonable assumptions based on common patterns.',
            )
        ]


def generate_assumptions_from_questions(
    questions: list[ClarifyingQuestion],
) -> list[Assumption]:
    """
    Generate assumptions for all questions (used when user skips).

    Args:
        questions: List of clarifying questions

    Returns:
        List of Assumption objects based on AI suggestions
    """
    assumptions = []
    for q in questions:
        assumption = Assumption(
            question_id=q.id,
            assumed_value=q.ai_suggestion or 'Using default/common approach',
            confidence=70.0,  # Default confidence for AI assumptions
            reasoning=f'Based on common patterns for: {q.question_text}',
        )
        assumptions.append(assumption)

    return assumptions


async def refine_requirements(
    original_input: str,
    questions: list[ClarifyingQuestion],
    answers: list[UserAnswer],
    assumptions: list[Assumption],
    model: str | None = None,
) -> str:
    """
    Refine requirements based on user answers and assumptions.

    Args:
        original_input: Original user requirement
        questions: List of clarifying questions asked
        answers: List of user answers
        assumptions: List of assumptions for skipped questions
        model: Optional model override

    Returns:
        Refined requirements string in structured format
    """
    llm_config = get_llm_config()

    # Build Q&A pairs
    qa_pairs = []
    answer_map = {a.question_id: a for a in answers}

    for q in questions:
        answer = answer_map.get(q.id)
        if answer and answer.answer_type != 'skipped':
            if answer.free_text_answer:
                qa_pairs.append(f'Q: {q.question_text}\nA: {answer.free_text_answer}')
            elif answer.selected_options:
                options_text = ', '.join(answer.selected_options)
                qa_pairs.append(f'Q: {q.question_text}\nA: {options_text}')

    # Build assumptions text
    assumption_map = {a.question_id: a for a in assumptions}
    assumptions_text = []
    for q in questions:
        if q.id in assumption_map:
            a = assumption_map[q.id]
            assumptions_text.append(
                f'- {q.question_text}: {a.assumed_value} (confidence: {a.confidence}%)'
            )

    prompt = REFINE_REQUIREMENTS_PROMPT.format(
        original_input=original_input,
        qa_pairs='\n\n'.join(qa_pairs) if qa_pairs else 'No questions were answered.',
        assumptions='\n'.join(assumptions_text)
        if assumptions_text
        else 'No assumptions made.',
    )

    try:
        response = await acompletion(
            model=model or llm_config['model'],
            messages=[{'role': 'user', 'content': prompt}],
            api_base=llm_config['api_base'],
            api_key=llm_config['api_key'],
            temperature=0.3,
            max_tokens=2048,
        )
        refined = response.choices[0].message.content
        logger.info('[Generator] Requirements refined successfully')
        return refined

    except Exception as e:
        logger.error(f'[Generator] Failed to refine requirements: {e}')
        # Fallback to basic refinement
        return f"""## Refined Requirements

### Original Request
{original_input}

### Clarified Details
Unable to refine due to error: {e}

### Assumptions Made
{chr(10).join(assumptions_text) if assumptions_text else 'None'}
"""


def create_clarification_session(
    conversation_id: str,
    user_input: str,
    ambiguity_result: AmbiguityResult,
    questions: list[ClarifyingQuestion],
    config: ClarificationConfig | None = None,
) -> ClarificationSession:
    """
    Create a new clarification session.

    Args:
        conversation_id: ID of the parent conversation
        user_input: Original user requirement
        ambiguity_result: Result from ambiguity detection
        questions: Generated clarifying questions
        config: Optional configuration

    Returns:
        New ClarificationSession object
    """
    if config is None:
        config = ClarificationConfig()

    return ClarificationSession(
        id=f'clarify_{uuid.uuid4().hex[:12]}',
        conversation_id=conversation_id,
        original_input=user_input,
        ambiguity_score=ambiguity_result.score,
        questions=questions,
        answers=[],
        assumptions=[],
        refined_requirements=None,
        status=ClarificationStatus.PENDING,
        current_round=1,
        max_rounds=config.max_rounds,
    )
