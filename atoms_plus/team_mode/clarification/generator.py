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

            # Ensure "other" option exists if allow_other is true
            allow_other = q_data.get('allow_other', True)
            has_other = any(opt.id == 'other' for opt in options)
            if allow_other and not has_other:
                options.append(
                    QuestionOption(
                        id='other',
                        text='Other (specify)',
                        description='I have a different requirement',
                    )
                )

            # Force single-choice for MCQ UX (override any free-text)
            question_type_str = q_data.get('question_type', 'single-choice')
            if question_type_str == 'free-text':
                question_type_str = 'single-choice'  # Convert to MCQ

            question = ClarifyingQuestion(
                id=q_data.get('id', f'q_{uuid.uuid4().hex[:8]}'),
                question_text=q_data.get('question_text', ''),
                question_type=QuestionType(question_type_str),
                category=QuestionCategory(q_data.get('category', 'behavior')),
                priority=QuestionPriority(q_data.get('priority', 'important')),
                options=options,
                allow_other=allow_other,
                ai_suggestion=q_data.get('ai_suggestion'),
            )
            questions.append(question)

        logger.info(f'[Generator] Generated {len(questions)} clarifying questions')
        return questions

    except Exception as e:
        logger.error(f'[Generator] Failed to generate questions: {e}')
        # Return fallback questions for each ambiguous aspect
        fallback_questions = []

        # Question templates for common aspects
        aspect_templates = {
            'scope': ClarifyingQuestion(
                id='fallback_scope',
                question_text='What is the scope of this project?',
                question_type=QuestionType.SINGLE_CHOICE,
                category=QuestionCategory.BEHAVIOR,
                priority=QuestionPriority.CRITICAL,
                options=[
                    QuestionOption(
                        id='opt1',
                        text='Prototype / Demo',
                        description='Quick proof of concept',
                    ),
                    QuestionOption(
                        id='opt2',
                        text='MVP',
                        description='Minimum viable product for launch',
                    ),
                    QuestionOption(
                        id='opt3',
                        text='Production-ready',
                        description='Full application ready for users',
                    ),
                    QuestionOption(
                        id='other',
                        text='Other (specify)',
                        description='I have specific scope requirements',
                    ),
                ],
                allow_other=True,
                ai_suggestion='opt2',
            ),
            'complexity': ClarifyingQuestion(
                id='fallback_complexity',
                question_text='What level of complexity do you need?',
                question_type=QuestionType.SINGLE_CHOICE,
                category=QuestionCategory.BEHAVIOR,
                priority=QuestionPriority.CRITICAL,
                options=[
                    QuestionOption(
                        id='opt1',
                        text='Simple / Basic',
                        description='Core functionality only',
                    ),
                    QuestionOption(
                        id='opt2',
                        text='Standard',
                        description='Common features included',
                    ),
                    QuestionOption(
                        id='opt3',
                        text='Advanced',
                        description='Full-featured with edge cases',
                    ),
                    QuestionOption(
                        id='other',
                        text='Other (specify)',
                        description='Custom complexity level',
                    ),
                ],
                allow_other=True,
                ai_suggestion='opt1',
            ),
            'features': ClarifyingQuestion(
                id='fallback_features',
                question_text='Which features are most important?',
                question_type=QuestionType.MULTI_CHOICE,
                category=QuestionCategory.BEHAVIOR,
                priority=QuestionPriority.IMPORTANT,
                options=[
                    QuestionOption(
                        id='opt1',
                        text='User authentication',
                        description='Login/signup system',
                    ),
                    QuestionOption(
                        id='opt2',
                        text='Data persistence',
                        description='Save and retrieve data',
                    ),
                    QuestionOption(
                        id='opt3',
                        text='Responsive UI',
                        description='Works on mobile and desktop',
                    ),
                    QuestionOption(
                        id='opt4',
                        text='API integration',
                        description='Connect to external services',
                    ),
                    QuestionOption(
                        id='other',
                        text='Other (specify)',
                        description='Different features needed',
                    ),
                ],
                allow_other=True,
                ai_suggestion='opt1',
            ),
        }

        # Generate fallback question for each aspect
        for i, aspect in enumerate(ambiguous_aspects[: config.max_questions_per_round]):
            aspect_lower = aspect.lower()
            if aspect_lower in aspect_templates:
                fallback_questions.append(aspect_templates[aspect_lower])
            else:
                # Generic fallback for unknown aspects
                fallback_questions.append(
                    ClarifyingQuestion(
                        id=f'fallback_q{i + 1}',
                        question_text=f'What are your requirements for "{aspect}"?',
                        question_type=QuestionType.SINGLE_CHOICE,
                        category=QuestionCategory.BEHAVIOR,
                        priority=QuestionPriority.IMPORTANT,
                        options=[
                            QuestionOption(
                                id='opt1',
                                text='Simple approach',
                                description='Basic implementation',
                            ),
                            QuestionOption(
                                id='opt2',
                                text='Standard approach',
                                description='Common implementation',
                            ),
                            QuestionOption(
                                id='opt3',
                                text='Advanced approach',
                                description='Full implementation',
                            ),
                            QuestionOption(
                                id='other',
                                text='Other (specify)',
                                description='Custom requirements',
                            ),
                        ],
                        allow_other=True,
                        ai_suggestion='opt1',
                    )
                )

        logger.info(f'[Generator] Using {len(fallback_questions)} fallback questions')
        return (
            fallback_questions
            if fallback_questions
            else [aspect_templates['complexity']]
        )


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
