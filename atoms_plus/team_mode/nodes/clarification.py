# Atoms Plus - Clarification Agent Nodes
"""
HITL (Human-in-the-Loop) nodes for requirement clarification.

These nodes implement the ClarifyGPT-inspired ambiguity detection
and clarification workflow:

1. pm_detect_ambiguity - Detects if requirements are ambiguous
2. pm_await_clarification - Pauses for user input (HITL interrupt)
3. pm_refine_requirements - Refines requirements based on user answers
"""

from __future__ import annotations

import logging

from langgraph.types import interrupt

# Import directly from modules to avoid circular imports
from atoms_plus.team_mode.clarification.detector import detect_ambiguity
from atoms_plus.team_mode.clarification.generator import (
    create_clarification_session,
    generate_assumptions_from_questions,
    generate_questions,
    refine_requirements,
)
from atoms_plus.team_mode.clarification.models import (
    ClarificationConfig,
    ClarificationStatus,
)
from atoms_plus.team_mode.nodes.base import (
    AgentRole,
    AgentStatus,
    update_state_with_thought,
)
from atoms_plus.team_mode.state import TeamState

logger = logging.getLogger(__name__)


async def pm_detect_ambiguity_node(state: TeamState) -> TeamState:
    """
    PM node that detects ambiguity in user requirements.

    If ambiguity is detected (score > threshold), sets clarification_required=True
    and generates clarifying questions.

    Args:
        state: Current TeamState

    Returns:
        Updated TeamState with ambiguity detection results
    """
    logger.info('[PM-Clarify] Starting ambiguity detection')

    # Update state to show PM is analyzing
    state = update_state_with_thought(
        state,
        AgentRole.PM,
        'Analyzing requirements for ambiguity...',
        AgentStatus.THINKING,
    )

    task = state.get('task', '')
    if not task:
        logger.warning('[PM-Clarify] No task provided')
        return state

    config = ClarificationConfig()

    try:
        # Detect ambiguity
        ambiguity_result = await detect_ambiguity(task, config)

        logger.info(
            f'[PM-Clarify] Ambiguity score: {ambiguity_result.score:.1f} '
            f'(threshold: {config.ambiguity_threshold})'
        )

        if ambiguity_result.is_ambiguous:
            # Generate clarifying questions
            questions = await generate_questions(
                task,
                ambiguity_result.ambiguous_aspects,
                config,
            )

            # Create clarification session
            session = create_clarification_session(
                conversation_id=state.get('session_id', ''),
                user_input=task,
                ambiguity_result=ambiguity_result,
                questions=questions,
                config=config,
            )

            # Update state with clarification data
            state['clarification_required'] = True
            state['clarification_session'] = session.model_dump()

            state = update_state_with_thought(
                state,
                AgentRole.PM,
                f'Found {len(ambiguity_result.ambiguous_aspects)} ambiguous aspects. '
                f'Preparing {len(questions)} clarifying questions.',
                AgentStatus.WAITING,
            )

            logger.info(
                f'[PM-Clarify] Generated {len(questions)} questions for '
                f'{len(ambiguity_result.ambiguous_aspects)} ambiguous aspects'
            )

        else:
            # Requirements are clear - proceed without clarification
            state['clarification_required'] = False
            state['clarification_session'] = None

            state = update_state_with_thought(
                state,
                AgentRole.PM,
                'Requirements are clear. Proceeding to architecture design.',
                AgentStatus.RESPONDING,
            )

            logger.info('[PM-Clarify] Requirements clear, no clarification needed')

    except Exception as e:
        logger.error(f'[PM-Clarify] Error detecting ambiguity: {e}')
        # On error, assume requirements are clear and proceed
        state['clarification_required'] = False
        state['error'] = f'Ambiguity detection error: {str(e)}'

    return state


async def pm_await_clarification_node(state: TeamState) -> TeamState:
    """
    HITL node that pauses execution for user clarification.

    Uses LangGraph's interrupt() to pause the graph and wait for
    user input via the WebSocket event system.

    The frontend will:
    1. Receive clarification:questions event
    2. Display questions to user
    3. Submit answers via clarification:answer or clarification:skip
    4. Call graph.update() with user answers to resume

    Args:
        state: Current TeamState with clarification_session

    Returns:
        Updated TeamState after user provides answers
    """
    logger.info('[PM-Clarify] Awaiting user clarification')

    session_data = state.get('clarification_session')
    if not session_data:
        logger.warning('[PM-Clarify] No clarification session found')
        return state

    # Import here to avoid circular imports
    from atoms_plus.team_mode.clarification.models import ClarificationSession

    session = ClarificationSession.model_validate(session_data)

    state = update_state_with_thought(
        state,
        AgentRole.PM,
        f'Waiting for your input on {len(session.questions)} clarifying questions...',
        AgentStatus.WAITING,
    )

    # Prepare interrupt payload for frontend
    questions_payload = [
        {
            'id': q.id,
            'question_text': q.question_text,
            'question_type': q.question_type.value,
            'category': q.category.value,
            'priority': q.priority.value,
            'options': [
                {'id': o.id, 'text': o.text, 'description': o.description}
                for o in q.options
            ],
            'ai_suggestion': q.ai_suggestion,
        }
        for q in session.questions
    ]

    # HITL INTERRUPT: Pause graph execution
    # This will be resumed when the frontend calls graph.update() with answers
    user_response = interrupt(
        {
            'type': 'clarification:questions',
            'session_id': session.id,
            'questions': questions_payload,
            'can_skip': True,
            'message': 'Please answer the following questions to clarify your requirements.',
        }
    )

    # When resumed, user_response contains the answers
    logger.info(f'[PM-Clarify] Received user response: {type(user_response)}')

    # Process user response
    if isinstance(user_response, dict):
        answers = user_response.get('answers', [])
        skipped = user_response.get('skipped', False)

        if skipped:
            state['clarification_skipped'] = True
            logger.info('[PM-Clarify] User skipped clarification')
        else:
            # Update session with answers
            from atoms_plus.team_mode.clarification.models import AnswerType, UserAnswer

            user_answers = []
            for ans in answers:
                user_answers.append(
                    UserAnswer(
                        question_id=ans.get('question_id', ''),
                        answer_type=AnswerType(ans.get('answer_type', 'selected')),
                        selected_options=ans.get('selected_options', []),
                        free_text_answer=ans.get('free_text_answer'),
                    )
                )

            session.answers = user_answers
            session.status = ClarificationStatus.ANSWERED
            state['clarification_session'] = session.model_dump()

            logger.info(f'[PM-Clarify] Received {len(user_answers)} answers')

    return state


async def pm_refine_requirements_node(state: TeamState) -> TeamState:
    """
    PM node that refines requirements based on clarification.

    Takes user answers (or assumptions if skipped) and produces
    refined, unambiguous requirements.

    Args:
        state: Current TeamState with answers

    Returns:
        Updated TeamState with refined_requirements
    """
    logger.info('[PM-Clarify] Refining requirements')

    session_data = state.get('clarification_session')
    original_task = state.get('task', '')

    if not session_data:
        # No clarification was needed
        state['refined_requirements'] = original_task
        return state

    # Import here to avoid circular imports
    from atoms_plus.team_mode.clarification.models import ClarificationSession

    session = ClarificationSession.model_validate(session_data)

    state = update_state_with_thought(
        state,
        AgentRole.PM,
        'Refining requirements based on your answers...',
        AgentStatus.THINKING,
    )

    # Generate assumptions for any unanswered questions
    answered_ids = {a.question_id for a in session.answers}
    unanswered = [q for q in session.questions if q.id not in answered_ids]
    assumptions = generate_assumptions_from_questions(unanswered)

    # Add assumptions from skipped questions
    if state.get('clarification_skipped', False):
        assumptions = generate_assumptions_from_questions(session.questions)

    session.assumptions = assumptions

    try:
        # Refine requirements
        refined = await refine_requirements(
            original_input=original_task,
            questions=session.questions,
            answers=session.answers,
            assumptions=assumptions,
        )

        state['refined_requirements'] = refined
        session.refined_requirements = refined
        session.status = ClarificationStatus.COMPLETE
        state['clarification_session'] = session.model_dump()

        state = update_state_with_thought(
            state,
            AgentRole.PM,
            'Requirements refined. Ready for architecture design.',
            AgentStatus.RESPONDING,
        )

        logger.info('[PM-Clarify] Requirements refined successfully')

    except Exception as e:
        logger.error(f'[PM-Clarify] Error refining requirements: {e}')
        state['refined_requirements'] = original_task
        state['error'] = f'Refinement error: {str(e)}'

    return state


def should_clarify(state: TeamState) -> str:
    """
    Conditional edge function to determine if clarification is needed.

    Returns:
        'clarify' if clarification is required, 'proceed' otherwise
    """
    clarification_required = state.get('clarification_required', False)
    logger.info(
        f'[Router] should_clarify called: clarification_required={clarification_required}'
    )
    if clarification_required:
        logger.info('[Router] Routing to pm_await_clarification')
        return 'clarify'
    logger.info('[Router] Routing to pm (proceed)')
    return 'proceed'


def should_refine(state: TeamState) -> str:
    """
    Conditional edge function after clarification.

    Returns:
        'refine' if answers were provided, 'skip' if user skipped
    """
    if state.get('clarification_skipped', False):
        return 'skip'
    return 'refine'
