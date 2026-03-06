import { create } from "zustand";
import type {
  ClarifyingQuestion,
  UserAnswer,
  ClarificationResponse,
} from "./types";

interface ClarificationStoreState {
  // Clarification state
  isActive: boolean;
  sessionId: string | null;
  questions: ClarifyingQuestion[];
  answers: Map<string, UserAnswer>;
  canSkip: boolean;

  // Actions
  startClarification: (
    sessionId: string,
    questions: ClarifyingQuestion[],
    canSkip?: boolean,
  ) => void;
  setAnswer: (questionId: string, answer: UserAnswer) => void;
  skipQuestion: (questionId: string) => void;
  submitAnswers: () => ClarificationResponse;
  skipAll: () => ClarificationResponse;
  reset: () => void;
}

const initialState = {
  isActive: false,
  sessionId: null as string | null,
  questions: [] as ClarifyingQuestion[],
  answers: new Map<string, UserAnswer>(),
  canSkip: true,
};

export const useClarificationStore = create<ClarificationStoreState>(
  (set, get) => ({
    ...initialState,

    startClarification: (sessionId, questions, canSkip = true) =>
      set({
        isActive: true,
        sessionId,
        questions,
        canSkip,
        answers: new Map(),
      }),

    setAnswer: (questionId, answer) =>
      set((state) => {
        const newAnswers = new Map(state.answers);
        newAnswers.set(questionId, answer);
        return { answers: newAnswers };
      }),

    skipQuestion: (questionId) =>
      set((state) => {
        const question = state.questions.find((q) => q.id === questionId);
        const newAnswers = new Map(state.answers);
        newAnswers.set(questionId, {
          question_id: questionId,
          answer_type: "skipped",
          selected_options: [],
          free_text_answer: question?.ai_suggestion,
        });
        return { answers: newAnswers };
      }),

    submitAnswers: () => {
      const { answers, questions } = get();
      const answersArray: UserAnswer[] = [];

      // Collect all answers, marking unanswered as skipped
      for (const q of questions) {
        const answer = answers.get(q.id);
        if (answer) {
          answersArray.push(answer);
        } else {
          answersArray.push({
            question_id: q.id,
            answer_type: "skipped",
            free_text_answer: q.ai_suggestion,
          });
        }
      }

      // Reset after submission
      set(initialState);

      return {
        answers: answersArray,
        skipped: false,
      };
    },

    skipAll: () => {
      const { questions } = get();
      const answersArray: UserAnswer[] = questions.map((q) => ({
        question_id: q.id,
        answer_type: "skipped" as const,
        free_text_answer: q.ai_suggestion,
      }));

      // Reset after skip
      set(initialState);

      return {
        answers: answersArray,
        skipped: true,
      };
    },

    reset: () => set(initialState),
  }),
);
