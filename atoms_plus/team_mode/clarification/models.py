# Atoms Plus - Clarification Models
"""
Pydantic models for Human-in-the-Loop requirement clarification.

Based on ClarifyGPT framework for ambiguity detection and question generation.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class QuestionType(str, Enum):
    """Type of clarifying question."""

    SINGLE_CHOICE = 'single-choice'
    MULTI_CHOICE = 'multi-choice'
    FREE_TEXT = 'free-text'
    RANGE = 'range'


class QuestionCategory(str, Enum):
    """Category of clarifying question."""

    DATA = 'data'
    UI = 'ui'
    BEHAVIOR = 'behavior'
    INTEGRATION = 'integration'
    CONSTRAINTS = 'constraints'


class QuestionPriority(str, Enum):
    """Priority level of clarifying question."""

    CRITICAL = 'critical'
    IMPORTANT = 'important'
    NICE_TO_HAVE = 'nice-to-have'


class ClarificationStatus(str, Enum):
    """Status of a clarification session."""

    PENDING = 'pending'
    ANSWERED = 'answered'
    SKIPPED = 'skipped'
    COMPLETE = 'complete'


class AnswerType(str, Enum):
    """Type of user answer."""

    SELECTED = 'selected'
    TYPED = 'typed'
    SKIPPED = 'skipped'


class QuestionOption(BaseModel):
    """An option for a single/multi-choice question."""

    id: str
    text: str
    description: str | None = None


class ClarifyingQuestion(BaseModel):
    """A single clarifying question for the user."""

    id: str
    question_text: str
    question_type: QuestionType
    category: QuestionCategory
    priority: QuestionPriority
    options: list[QuestionOption] = Field(default_factory=list)
    allow_other: bool = True  # Whether to show "Other" option with text input
    ai_suggestion: str | None = None  # What AI would assume if skipped (option ID)


class UserAnswer(BaseModel):
    """User's answer to a clarifying question."""

    question_id: str
    answer_type: AnswerType
    selected_options: list[str] = Field(default_factory=list)
    free_text_answer: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Assumption(BaseModel):
    """An assumption made by AI when user skips clarification."""

    question_id: str
    assumed_value: str
    confidence: float = Field(ge=0, le=100)  # 0-100
    reasoning: str


class AmbiguityResult(BaseModel):
    """Result of ambiguity detection analysis."""

    score: float = Field(ge=0, le=100)  # 0-100, higher = more ambiguous
    is_ambiguous: bool
    ambiguous_aspects: list[str] = Field(default_factory=list)
    interpretations: list[str] = Field(default_factory=list)
    similarity_scores: list[float] = Field(default_factory=list)
    suggested_questions: list[ClarifyingQuestion] = Field(default_factory=list)


class ClarificationSession(BaseModel):
    """A complete clarification session."""

    id: str
    conversation_id: str
    original_input: str
    ambiguity_score: float = Field(ge=0, le=100)
    questions: list[ClarifyingQuestion] = Field(default_factory=list)
    answers: list[UserAnswer] = Field(default_factory=list)
    assumptions: list[Assumption] = Field(default_factory=list)
    refined_requirements: str | None = None
    status: ClarificationStatus = ClarificationStatus.PENDING
    current_round: int = 1
    max_rounds: int = 3
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ClarificationConfig(BaseModel):
    """Configuration for clarification behavior."""

    ambiguity_threshold: float = Field(default=40.0, ge=0, le=100)
    max_questions_per_round: int = Field(default=4, ge=1, le=10)
    max_rounds: int = Field(default=3, ge=1, le=5)
    num_interpretations: int = Field(default=3, ge=2, le=5)
    enable_skip: bool = True
    auto_proceed_threshold: float = Field(default=20.0, ge=0, le=100)
