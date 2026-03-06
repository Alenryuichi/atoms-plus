# Atoms Plus - Clarification Prompts
"""
LLM prompts for ClarifyGPT-inspired ambiguity detection and question generation.
"""

INTERPRETATION_SYSTEM_PROMPT = """You are a senior software developer analyzing a user's requirement.
Your task is to generate ONE specific, detailed interpretation of what the user wants built.

IMPORTANT:
- Be creative and specific in your interpretation
- Include concrete technical decisions (framework, database, UI components)
- Each interpretation should be different from others
- Focus on implementation details that could vary

Respond with a JSON object containing:
{
  "interpretation": "Your detailed interpretation of what to build",
  "technical_choices": ["List of specific technical decisions"],
  "key_features": ["List of main features you would implement"],
  "assumptions": ["List of assumptions you're making"]
}"""

AMBIGUITY_DETECTION_PROMPT = """Analyze the following user requirement and identify ambiguous aspects.

User Requirement: {user_input}

Compare these {n} different interpretations:
{interpretations}

Identify aspects where the interpretations DIVERGE significantly.
Focus on:
1. Data sources and storage
2. UI/UX decisions
3. Feature scope and behavior
4. Integration requirements
5. Performance and constraints

Respond with a JSON object:
{{
  "ambiguous_aspects": ["List of aspects where interpretations differ"],
  "divergence_summary": "Brief explanation of main differences",
  "clarity_areas": ["List of aspects that are clear/consistent"]
}}"""

QUESTION_GENERATION_PROMPT = """Generate clarifying questions for the following ambiguous requirement.

User Requirement: {user_input}

Identified Ambiguous Aspects:
{ambiguous_aspects}

Generate targeted questions to resolve these ambiguities.

RULES:
1. Maximum {max_questions} questions
2. Each question must be specific and actionable
3. Provide 2-4 options for single/multi-choice questions
4. Include what you would assume if the user skips (ai_suggestion)
5. Prioritize questions by impact on implementation

Question Categories:
- data: Data sources, storage, fields
- ui: Layout, styling, components
- behavior: User interactions, error handling
- integration: APIs, services, authentication
- constraints: Performance, browser support, accessibility

Respond with a JSON array of questions:
[
  {{
    "id": "q1",
    "question_text": "Clear, specific question",
    "question_type": "single-choice|multi-choice|free-text",
    "category": "data|ui|behavior|integration|constraints",
    "priority": "critical|important|nice-to-have",
    "options": [
      {{"id": "opt1", "text": "Option text", "description": "Optional description"}}
    ],
    "ai_suggestion": "What AI would assume if skipped"
  }}
]"""

REFINE_REQUIREMENTS_PROMPT = """Refine the user's requirements based on their answers to clarifying questions.

Original Request:
{original_input}

Clarification Q&A:
{qa_pairs}

Assumptions Made (for skipped questions):
{assumptions}

Generate refined requirements in this format:

## Refined Requirements

### Original Request
[Copy of original request]

### Clarified Details
[Organized list of clarified requirements with specific details]

### Assumptions Made
[List of assumptions for any skipped questions]

### Technical Constraints
[Any technical constraints identified]

Be specific and actionable. Include concrete details that an Architect can use."""

SIMILARITY_ANALYSIS_PROMPT = """Compare these code/feature interpretations and rate their similarity.

Interpretation 1:
{interp1}

Interpretation 2:
{interp2}

Rate the SEMANTIC similarity on a scale of 0.0 to 1.0:
- 1.0 = Identical meaning and implementation
- 0.7+ = Very similar, minor differences
- 0.4-0.7 = Moderately similar, some key differences
- 0.2-0.4 = Somewhat different, significant divergence
- 0.0-0.2 = Completely different approaches

Respond with a JSON object:
{{
  "similarity_score": 0.0-1.0,
  "matching_aspects": ["List of aspects that are similar"],
  "diverging_aspects": ["List of aspects that differ"],
  "reasoning": "Brief explanation of the similarity score"
}}"""
