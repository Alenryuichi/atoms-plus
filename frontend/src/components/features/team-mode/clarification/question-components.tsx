import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/button";
import { I18nKey } from "#/i18n/declaration";
import type { ClarifyingQuestion, UserAnswer } from "./types";

interface QuestionProps {
  question: ClarifyingQuestion;
  onAnswer: (answer: UserAnswer) => void;
  onSkip: () => void;
}

// SkipButton defined first to avoid no-use-before-define
function SkipButton({
  question,
  onSkip,
}: {
  question: ClarifyingQuestion;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between text-xs">
      <Button size="sm" variant="ghost" onClick={onSkip}>
        {t(I18nKey.CLARIFICATION$SKIP_QUESTION)}
      </Button>
      {question.ai_suggestion && (
        <span className="text-default-400 italic truncate max-w-[200px]">
          {t(I18nKey.CLARIFICATION$AI_SUGGESTION, {
            suggestion: question.ai_suggestion,
          })}
        </span>
      )}
    </div>
  );
}

export function SingleChoiceQuestion({
  question,
  onAnswer,
  onSkip,
}: QuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    setSelected(optionId);
    onAnswer({
      question_id: question.id,
      answer_type: "selected",
      selected_options: [optionId],
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selected === option.id
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-default-200 hover:border-default-300 bg-default-50"
            }`}
          >
            <div className="font-medium text-sm">{option.text}</div>
            {option.description && (
              <div className="text-xs text-default-500 mt-1">
                {option.description}
              </div>
            )}
          </button>
        ))}
      </div>
      <SkipButton question={question} onSkip={onSkip} />
    </div>
  );
}

export function MultiChoiceQuestion({
  question,
  onAnswer,
  onSkip,
}: QuestionProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOption = (optionId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelected(newSelected);
    onAnswer({
      question_id: question.id,
      answer_type: "selected",
      selected_options: Array.from(newSelected),
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => toggleOption(option.id)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selected.has(option.id)
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-default-200 hover:border-default-300 bg-default-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  selected.has(option.id)
                    ? "border-primary-500 bg-primary-500"
                    : "border-default-300"
                }`}
              >
                {selected.has(option.id) && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div>
                <div className="font-medium text-sm">{option.text}</div>
                {option.description && (
                  <div className="text-xs text-default-500">
                    {option.description}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
      <SkipButton question={question} onSkip={onSkip} />
    </div>
  );
}

export function FreeTextQuestion({
  question,
  onAnswer,
  onSkip,
}: QuestionProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");

  const handleChange = (value: string) => {
    setText(value);
    if (value.trim()) {
      onAnswer({
        question_id: question.id,
        answer_type: "free-text",
        free_text_answer: value,
      });
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t(I18nKey.CLARIFICATION$TYPE_ANSWER)}
        className="w-full p-3 rounded-lg border border-default-200 bg-default-50 text-sm resize-none focus:border-primary-500 focus:outline-none"
        rows={3}
      />
      <SkipButton question={question} onSkip={onSkip} />
    </div>
  );
}
