# Atoms Plus - Ambiguity Detector
"""ClarifyGPT-inspired ambiguity detection (OPTIMIZED).

Detects ambiguous requirements by:
1. Generating 2 different interpretations in a SINGLE LLM call
2. Using difflib for fast text similarity (no LLM)
3. Low similarity = high ambiguity

Reference: FSE 2024 - ClarifyGPT

Performance optimizations (v2):
- Single LLM call for all interpretations (batch generation)
- difflib text similarity instead of LLM similarity
- Skip identify_ambiguous_aspects (use defaults)
- Target: ~15-20 seconds vs ~80 seconds
"""

from __future__ import annotations

import asyncio
import json
import logging
from difflib import SequenceMatcher
from itertools import combinations

from atoms_plus.team_mode.clarification.models import (
    AmbiguityResult,
    ClarificationConfig,
)
from atoms_plus.team_mode.clarification.prompts import (
    AMBIGUITY_DETECTION_PROMPT,
    INTERPRETATION_SYSTEM_PROMPT,
    SIMILARITY_ANALYSIS_PROMPT,
)
from atoms_plus.team_mode.nodes.base import get_llm_config

logger = logging.getLogger(__name__)

try:
    from litellm import acompletion
except ImportError:
    acompletion = None  # For testing without litellm


# ============================================================================
# FAST PATH: Batch interpretation generation + difflib similarity
# ============================================================================

BATCH_INTERPRETATION_PROMPT = """You are analyzing a software requirement for ambiguity.

Generate 2 VERY DIFFERENT interpretations of this requirement. Each interpretation should represent a plausible but distinct way to implement it.

Requirement: {user_input}

Return a JSON object with exactly this structure:
{{
  "interpretation_1": {{
    "summary": "Brief summary of this interpretation",
    "technical_approach": "Main technical choices",
    "key_features": ["feature1", "feature2", "feature3"]
  }},
  "interpretation_2": {{
    "summary": "Brief summary of this interpretation",
    "technical_approach": "Main technical choices",
    "key_features": ["feature1", "feature2", "feature3"]
  }}
}}

Make interpretations significantly different in scope, complexity, or approach.
Return ONLY the JSON, no markdown."""


async def fast_generate_interpretations(
    user_input: str,
    model: str | None = None,
) -> list[dict]:
    """Generate 2 interpretations in a SINGLE LLM call (optimized).

    This replaces the parallel multi-call approach with a batch prompt.
    """
    llm_config = get_llm_config()

    try:
        response = await acompletion(
            model=model or llm_config['model'],
            messages=[
                {
                    'role': 'user',
                    'content': BATCH_INTERPRETATION_PROMPT.format(
                        user_input=user_input
                    ),
                }
            ],
            api_base=llm_config['api_base'],
            api_key=llm_config['api_key'],
            temperature=0.7,
            max_tokens=1024,
        )
        content = response.choices[0].message.content

        # Clean up markdown if present
        if content and content.strip().startswith('```'):
            lines = content.strip().split('\n')
            content = '\n'.join(
                line for line in lines if not line.strip().startswith('```')
            )

        result = json.loads(content)
        return [
            result.get('interpretation_1', {}),
            result.get('interpretation_2', {}),
        ]
    except Exception as e:
        logger.warning(f'[Detector] Fast interpretation failed: {e}')
        # Return default interpretations
        return [
            {'summary': 'Simple MVP', 'key_features': ['basic']},
            {'summary': 'Full-featured', 'key_features': ['advanced']},
        ]


def fast_calculate_similarity(interp1: dict, interp2: dict) -> float:
    """Calculate text similarity using difflib (no LLM call).

    Fast alternative to LLM-based similarity calculation.
    """
    # Convert interpretations to comparable strings
    text1 = json.dumps(interp1, sort_keys=True)
    text2 = json.dumps(interp2, sort_keys=True)

    # Use SequenceMatcher for similarity
    similarity = SequenceMatcher(None, text1, text2).ratio()
    return similarity


async def fast_detect_ambiguity(
    user_input: str,
    config: ClarificationConfig | None = None,
    model: str | None = None,
) -> AmbiguityResult:
    """FAST ambiguity detection (optimized path).

    1. Single LLM call for 2 interpretations
    2. difflib similarity (no LLM)
    3. Skip identify_ambiguous_aspects

    Target: ~15-20 seconds vs ~80 seconds original.
    """
    if config is None:
        config = ClarificationConfig()

    logger.info(f'[Detector-Fast] Analyzing: {user_input[:60]}...')

    # Step 1: Generate interpretations (single LLM call)
    interpretations = await fast_generate_interpretations(user_input, model)
    logger.info(f'[Detector-Fast] Generated {len(interpretations)} interpretations')

    # Step 2: Calculate similarity (no LLM)
    if len(interpretations) >= 2:
        similarity = fast_calculate_similarity(interpretations[0], interpretations[1])
    else:
        similarity = 1.0

    logger.info(f'[Detector-Fast] Similarity: {similarity:.2f}')

    # Step 3: Calculate ambiguity score
    ambiguity_score = (1 - similarity) * 100
    is_ambiguous = ambiguity_score > config.ambiguity_threshold

    # Step 4: Default ambiguous aspects (skip LLM call)
    ambiguous_aspects = ['scope', 'complexity', 'features'] if is_ambiguous else []

    logger.info(
        f'[Detector-Fast] Score: {ambiguity_score:.1f}, '
        f'threshold: {config.ambiguity_threshold}, '
        f'is_ambiguous: {is_ambiguous}'
    )

    return AmbiguityResult(
        score=ambiguity_score,
        is_ambiguous=is_ambiguous,
        ambiguous_aspects=ambiguous_aspects,
        interpretations=[
            interp.get('summary', str(interp)) for interp in interpretations
        ],
        similarity_scores=[similarity],
        suggested_questions=[],
    )


# ============================================================================
# LEGACY PATH: Original multi-call implementation (kept for reference)
# ============================================================================


async def _generate_single_interpretation(
    user_input: str,
    index: int,
    total: int,
    model: str | None,
    llm_config: dict,
) -> dict:
    """Generate a single interpretation (helper for parallel execution)."""
    messages = [
        {'role': 'system', 'content': INTERPRETATION_SYSTEM_PROMPT},
        {
            'role': 'user',
            'content': f'Requirement: {user_input}\n\n'
            f'Generate interpretation #{index + 1} of {total}. '
            f'Be creative and specific. Make this interpretation DIFFERENT from typical approaches.',
        },
    ]

    try:
        response = await acompletion(
            model=model or llm_config['model'],
            messages=messages,
            api_base=llm_config['api_base'],
            api_key=llm_config['api_key'],
            temperature=0.9,  # Higher temperature for diversity
            max_tokens=1024,
        )
        content = response.choices[0].message.content

        # Handle empty or None response from LLM
        if not content or not content.strip():
            logger.warning(f'Empty LLM response for interpretation {index + 1}')
            return {
                'interpretation': f'Default interpretation {index + 1}',
                'technical_choices': ['standard approach'],
                'key_features': ['basic implementation'],
                'assumptions': ['using defaults'],
            }

        # Try to extract JSON from response (LLM might wrap it in markdown)
        content = content.strip()
        if content.startswith('```'):
            # Extract JSON from markdown code block
            lines = content.split('\n')
            json_lines = []
            in_block = False
            for line in lines:
                if line.startswith('```') and not in_block:
                    in_block = True
                    continue
                if line.startswith('```') and in_block:
                    break
                if in_block:
                    json_lines.append(line)
            content = '\n'.join(json_lines)

        return json.loads(content)
    except json.JSONDecodeError as e:
        logger.warning(f'Failed to parse JSON for interpretation {index + 1}: {e}')
        return {
            'interpretation': f'Interpretation {index + 1} (parse failed)',
            'technical_choices': ['standard approach'],
            'key_features': ['basic implementation'],
            'assumptions': ['using defaults'],
        }
    except Exception as e:
        logger.warning(f'Failed to generate interpretation {index + 1}: {e}')
        return {
            'interpretation': f'Interpretation {index + 1} generation failed',
            'technical_choices': [],
            'key_features': [],
            'assumptions': [],
        }


async def generate_interpretations(
    user_input: str,
    n: int = 3,
    model: str | None = None,
) -> list[dict]:
    """Generate N different interpretations of a user requirement.

    Uses asyncio.gather for parallel LLM calls (performance optimization).

    Args:
        user_input: The user's original requirement
        n: Number of interpretations to generate
        model: Optional model override

    Returns:
        List of interpretation dictionaries
    """
    llm_config = get_llm_config()

    # Create tasks for parallel execution
    tasks = [
        _generate_single_interpretation(user_input, i, n, model, llm_config)
        for i in range(n)
    ]

    # Execute all interpretations in parallel
    interpretations = await asyncio.gather(*tasks)
    return list(interpretations)


async def calculate_similarity(
    interp1: dict,
    interp2: dict,
    model: str | None = None,
) -> float:
    """Calculate semantic similarity between two interpretations.

    Args:
        interp1: First interpretation
        interp2: Second interpretation
        model: Optional model override

    Returns:
        Similarity score 0.0-1.0
    """
    config = get_llm_config()

    prompt = SIMILARITY_ANALYSIS_PROMPT.format(
        interp1=json.dumps(interp1, indent=2),
        interp2=json.dumps(interp2, indent=2),
    )

    try:
        response = await acompletion(
            model=model or config['model'],
            messages=[{'role': 'user', 'content': prompt}],
            api_base=config['api_base'],
            api_key=config['api_key'],
            temperature=0.3,
            max_tokens=512,
        )
        content = response.choices[0].message.content
        result = json.loads(content)
        return float(result.get('similarity_score', 0.5))
    except Exception as e:
        logger.warning(f'Failed to calculate similarity: {e}')
        return 0.5  # Default to moderate similarity


async def calculate_pairwise_similarity(
    interpretations: list[dict],
    model: str | None = None,
) -> tuple[float, list[float]]:
    """Calculate average pairwise similarity across all interpretations.

    Uses asyncio.gather for parallel LLM calls (performance optimization).

    Args:
        interpretations: List of interpretation dictionaries
        model: Optional model override

    Returns:
        Tuple of (average_similarity, list_of_individual_scores)
    """
    if len(interpretations) < 2:
        return 1.0, [1.0]

    pairs = list(combinations(range(len(interpretations)), 2))

    # Create tasks for parallel execution
    tasks = [
        calculate_similarity(interpretations[i], interpretations[j], model)
        for i, j in pairs
    ]

    # Execute all similarity calculations in parallel
    scores = await asyncio.gather(*tasks)
    scores_list = list(scores)

    avg_similarity = sum(scores_list) / len(scores_list) if scores_list else 1.0
    return avg_similarity, scores_list


async def identify_ambiguous_aspects(
    user_input: str,
    interpretations: list[dict],
    model: str | None = None,
) -> list[str]:
    """Identify specific aspects where interpretations diverge.

    Args:
        user_input: Original user requirement
        interpretations: List of interpretation dictionaries
        model: Optional model override

    Returns:
        List of ambiguous aspects
    """
    config = get_llm_config()

    interp_text = '\n\n'.join(
        [
            f'Interpretation {i + 1}:\n{json.dumps(interp, indent=2)}'
            for i, interp in enumerate(interpretations)
        ]
    )

    prompt = AMBIGUITY_DETECTION_PROMPT.format(
        user_input=user_input,
        n=len(interpretations),
        interpretations=interp_text,
    )

    try:
        response = await acompletion(
            model=model or config['model'],
            messages=[{'role': 'user', 'content': prompt}],
            api_base=config['api_base'],
            api_key=config['api_key'],
            temperature=0.3,
            max_tokens=1024,
        )
        content = response.choices[0].message.content
        result = json.loads(content)
        return result.get('ambiguous_aspects', [])
    except Exception as e:
        logger.warning(f'Failed to identify ambiguous aspects: {e}')
        return ['Unable to identify specific ambiguous aspects']


async def detect_ambiguity(
    user_input: str,
    config: ClarificationConfig | None = None,
    model: str | None = None,
    use_fast_path: bool = True,
) -> AmbiguityResult:
    """Detect ambiguity in user requirements.

    Main entry point for ambiguity detection. Uses fast path by default
    for ~15-20 second response time vs ~80 seconds legacy path.

    Args:
        user_input: The user's original requirement
        config: Optional configuration overrides
        model: Optional model override
        use_fast_path: Use optimized detection (default True)

    Returns:
        AmbiguityResult with score, aspects, and suggested questions
    """
    # Use optimized fast path by default
    if use_fast_path:
        return await fast_detect_ambiguity(user_input, config, model)

    # Legacy path (kept for reference/testing)
    return await _legacy_detect_ambiguity(user_input, config, model)


async def _legacy_detect_ambiguity(
    user_input: str,
    config: ClarificationConfig | None = None,
    model: str | None = None,
) -> AmbiguityResult:
    """Legacy ambiguity detection (multi-call approach).

    Kept for reference and fallback. Use detect_ambiguity() instead.
    """
    if config is None:
        config = ClarificationConfig()

    logger.info(f'[Detector-Legacy] Analyzing: {user_input[:100]}...')

    # Step 1: Generate multiple interpretations
    interpretations = await generate_interpretations(
        user_input,
        n=config.num_interpretations,
        model=model,
    )
    logger.info(f'[Detector-Legacy] Generated {len(interpretations)} interpretations')

    # Step 2: Calculate pairwise similarity
    avg_similarity, similarity_scores = await calculate_pairwise_similarity(
        interpretations,
        model,
    )
    logger.info(f'[Detector-Legacy] Average similarity: {avg_similarity:.2f}')

    # Step 3: Calculate ambiguity score (inverse of similarity)
    ambiguity_score = (1 - avg_similarity) * 100
    is_ambiguous = ambiguity_score > config.ambiguity_threshold

    # Step 4: Identify ambiguous aspects (only if ambiguous)
    ambiguous_aspects = []
    if is_ambiguous:
        ambiguous_aspects = await identify_ambiguous_aspects(
            user_input,
            interpretations,
            model,
        )

    logger.info(
        f'[Detector-Legacy] Ambiguity score: {ambiguity_score:.1f}, '
        f'threshold: {config.ambiguity_threshold}, '
        f'is_ambiguous: {is_ambiguous}'
    )

    return AmbiguityResult(
        score=ambiguity_score,
        is_ambiguous=is_ambiguous,
        ambiguous_aspects=ambiguous_aspects,
        interpretations=[
            interp.get('interpretation', str(interp)) for interp in interpretations
        ],
        similarity_scores=similarity_scores,
        suggested_questions=[],
    )
