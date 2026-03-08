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

QUESTION_GENERATION_PROMPT = """Generate **single-choice clarifying questions** for the following ambiguous requirement.

User Requirement: {user_input}

Identified Ambiguous Aspects:
{ambiguous_aspects}

Generate **closed-ended questions** with pre-defined options that represent different interpretations.

CRITICAL RULES:
1. Maximum {max_questions} questions
2. **ALWAYS use "single-choice"** question type (NOT free-text)
3. Each question must have **exactly 4 options**:
   - Option 1-3: Specific interpretations (from simple to complex)
   - Option 4: "other" - Allow user to specify custom answer
4. Options should represent **different implementation approaches**
5. Include "ai_suggestion" - the default option if user skips

Question Design Guidelines:
- Start simple: First option should be the simplest/minimal approach
- Be specific: Each option should describe a concrete implementation
- Avoid jargon: Use plain language users can understand
- Progressive: Options should increase in complexity

Categories:
- data: Data sources, storage, fields
- ui: Layout, styling, components
- behavior: User interactions, error handling
- integration: APIs, services, authentication
- constraints: Performance, browser support, accessibility

Respond with a JSON array:
[
  {{
    "id": "q1",
    "question_text": "Clear question ending with ?",
    "question_type": "single-choice",
    "category": "data|ui|behavior|integration|constraints",
    "priority": "critical|important|nice-to-have",
    "allow_other": true,
    "options": [
      {{"id": "opt1", "text": "Simple approach", "description": "Brief explanation"}},
      {{"id": "opt2", "text": "Medium approach", "description": "Brief explanation"}},
      {{"id": "opt3", "text": "Full-featured approach", "description": "Brief explanation"}},
      {{"id": "other", "text": "Other (specify)", "description": "I have a different requirement"}}
    ],
    "ai_suggestion": "opt1"
  }}
]

EXAMPLE for "build a blog":
[
  {{
    "id": "q1",
    "question_text": "What features should the blog include?",
    "question_type": "single-choice",
    "category": "behavior",
    "priority": "critical",
    "allow_other": true,
    "options": [
      {{"id": "opt1", "text": "Simple blog", "description": "Post list + single post view"}},
      {{"id": "opt2", "text": "Interactive blog", "description": "+ Comments and likes"}},
      {{"id": "opt3", "text": "Full-featured blog", "description": "+ User accounts, categories, tags, search"}},
      {{"id": "other", "text": "Other (specify)", "description": "I have a different requirement"}}
    ],
    "ai_suggestion": "opt1"
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
