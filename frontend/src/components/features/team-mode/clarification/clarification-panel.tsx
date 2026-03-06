import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { useTracking } from "#/hooks/use-tracking";
import { useClarificationStore } from "./use-clarification-store";
import {
  SingleChoiceQuestion,
  MultiChoiceQuestion,
  FreeTextQuestion,
} from "./question-components";
import type { ClarifyingQuestion, UserAnswer } from "./types";

const PRIORITY_COLORS = {
  critical: "text-danger-600 bg-danger-50",
  important: "text-warning-600 bg-warning-50",
  "nice-to-have": "text-default-500 bg-default-100",
} as const;

const CATEGORY_ICONS = {
  data: "📊",
  ui: "🎨",
  behavior: "⚙️",
  integration: "🔗",
  constraints: "📏",
} as const;

// QuestionItem defined first to avoid no-use-before-define
interface QuestionItemProps {
  question: ClarifyingQuestion;
  index: number;
  onAnswer: (answer: UserAnswer) => void;
  onSkip: () => void;
  isAnswered: boolean;
}

function QuestionItem({
  question,
  index,
  onAnswer,
  onSkip,
  isAnswered,
}: QuestionItemProps) {
  const QuestionComponent = {
    "single-choice": SingleChoiceQuestion,
    "multi-choice": MultiChoiceQuestion,
    "free-text": FreeTextQuestion,
    range: FreeTextQuestion, // Fallback to free-text for range
  }[question.question_type];

  return (
    <div className={`space-y-2 ${isAnswered ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold text-primary-500 mt-0.5">
          Q{index + 1}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span>{CATEGORY_ICONS[question.category]}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLORS[question.priority]}`}
            >
              {question.priority}
            </span>
          </div>
          <p className="text-sm font-medium text-default-800">
            {question.question_text}
          </p>
        </div>
      </div>
      <div className="ml-6">
        <QuestionComponent
          question={question}
          onAnswer={onAnswer}
          onSkip={onSkip}
        />
      </div>
    </div>
  );
}

interface ClarificationPanelProps {
  onSubmit: (answers: UserAnswer[], skipped: boolean) => void;
}

export function ClarificationPanel({ onSubmit }: ClarificationPanelProps) {
  const { t } = useTranslation();
  const { trackClarificationSkipped, trackClarificationSubmitted } =
    useTracking();
  const {
    isActive,
    sessionId,
    questions,
    answers,
    canSkip,
    setAnswer,
    skipQuestion,
    submitAnswers,
    skipAll,
  } = useClarificationStore();

  if (!isActive || questions.length === 0) {
    return null;
  }

  const handleSubmit = () => {
    const response = submitAnswers();
    const answeredCount = response.answers.filter(
      (a) => a.answer_type !== "skipped",
    ).length;
    const skippedCount = response.answers.length - answeredCount;

    trackClarificationSubmitted({
      answeredCount,
      skippedCount,
      totalCount: response.answers.length,
      sessionId: sessionId || "unknown",
    });

    onSubmit(response.answers, response.skipped);
  };

  const handleSkipAll = () => {
    trackClarificationSkipped({
      all: true,
      sessionId: sessionId || "unknown",
    });

    const response = skipAll();
    onSubmit(response.answers, response.skipped);
  };

  const answeredCount = answers.size;
  const totalCount = questions.length;

  return (
    <div className="rounded-lg border border-primary-200 bg-primary-50/50 dark:bg-primary-900/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-primary-200 bg-primary-100/50 dark:bg-primary-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">❓</span>
            <h3 className="font-semibold text-primary-700 dark:text-primary-300">
              {t(I18nKey.CLARIFICATION$TITLE)}
            </h3>
          </div>
          <span className="text-xs text-primary-600 dark:text-primary-400">
            {t(I18nKey.CLARIFICATION$ANSWERED_COUNT, {
              answered: answeredCount,
              total: totalCount,
            })}
          </span>
        </div>
        <p className="text-xs text-primary-600/80 dark:text-primary-400/80 mt-1">
          {t(I18nKey.CLARIFICATION$HELP_TEXT)}
        </p>
      </div>

      {/* Questions */}
      <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto">
        {questions.map((question, index) => (
          <QuestionItem
            key={question.id}
            question={question}
            index={index}
            onAnswer={(answer) => setAnswer(question.id, answer)}
            onSkip={() => skipQuestion(question.id)}
            isAnswered={answers.has(question.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-primary-200 bg-primary-100/50 dark:bg-primary-900/20 flex justify-between">
        {canSkip && (
          <Button
            size="sm"
            variant="flat"
            color="default"
            onPress={handleSkipAll}
          >
            {t(I18nKey.CLARIFICATION$SKIP_ALL)}
          </Button>
        )}
        <Button
          size="sm"
          color="primary"
          onPress={handleSubmit}
          isDisabled={answeredCount === 0}
        >
          {t(I18nKey.CLARIFICATION$SUBMIT_ANSWERS)}
        </Button>
      </div>
    </div>
  );
}
