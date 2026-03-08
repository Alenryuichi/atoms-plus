/**
 * Types for Team Mode HITL Clarification
 */

export type QuestionType =
  | "single-choice"
  | "multi-choice"
  | "free-text"
  | "range";

export type QuestionCategory =
  | "data"
  | "ui"
  | "behavior"
  | "integration"
  | "constraints";

export type QuestionPriority = "critical" | "important" | "nice-to-have";

export interface QuestionOption {
  id: string;
  text: string;
  description?: string;
}

export interface ClarifyingQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  category: QuestionCategory;
  priority: QuestionPriority;
  options: QuestionOption[];
  allow_other?: boolean; // Whether to show "Other" option with text input
  ai_suggestion?: string; // Default option ID if skipped
}

export interface ClarificationPayload {
  type: "clarification:questions";
  session_id: string;
  questions: ClarifyingQuestion[];
  can_skip: boolean;
  message: string;
}

export interface UserAnswer {
  question_id: string;
  answer_type: "selected" | "free-text" | "skipped";
  selected_options?: string[];
  free_text_answer?: string;
}

export interface ClarificationResponse {
  answers: UserAnswer[];
  skipped: boolean;
}

export interface ClarificationState {
  isActive: boolean;
  sessionId: string | null;
  questions: ClarifyingQuestion[];
  answers: Map<string, UserAnswer>;
  canSkip: boolean;
}
