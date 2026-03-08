import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "#/lib/utils";
import { I18nKey } from "#/i18n/declaration";
import type { ClarifyingQuestion, UserAnswer } from "./types";

interface QuestionProps {
  question: ClarifyingQuestion;
  onAnswer: (answer: UserAnswer) => void;
  onSkip: () => void;
}

/**
 * Premium minimalist Skip button with AI suggestion hint
 */
function SkipButton({
  question,
  onSkip,
}: {
  question: ClarifyingQuestion;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        type="button"
        onClick={onSkip}
        className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors duration-200 py-1.5 px-2 -ml-2 rounded-md hover:bg-muted/50"
      >
        {t(I18nKey.CLARIFICATION$SKIP_QUESTION)}
      </button>
      {question.ai_suggestion && (
        <span className="text-[11px] text-muted-foreground/50 italic">
          {t(I18nKey.CLARIFICATION$AI_SUGGESTION, {
            suggestion: question.ai_suggestion,
          })}
        </span>
      )}
    </div>
  );
}

/**
 * Premium minimalist radio button component
 * Inspired by Linear/Notion design language
 */
function RadioIndicator({ isSelected }: { isSelected: boolean }) {
  return (
    <div
      className={cn(
        "relative w-[18px] h-[18px] rounded-full flex-shrink-0",
        "border-2 transition-all duration-200 ease-out",
        isSelected
          ? "border-primary bg-primary"
          : "border-border/60 hover:border-border",
      )}
    >
      {/* Inner dot with scale animation */}
      <div
        className={cn(
          "absolute inset-0 m-auto w-2 h-2 rounded-full bg-primary-foreground",
          "transition-all duration-200 ease-out",
          isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      />
    </div>
  );
}

/**
 * SingleChoiceQuestion - Premium minimalist MCQ component
 *
 * Design principles:
 * - High whitespace, low visual noise
 * - Subtle shadows and borders
 * - Smooth 200ms transitions
 * - Custom radio buttons
 * - Mobile-friendly touch targets (min 44px)
 */
export function SingleChoiceQuestion({
  question,
  onAnswer,
  onSkip,
}: QuestionProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [isOtherExpanded, setIsOtherExpanded] = useState(false);
  const otherTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when "Other" is expanded
  useEffect(() => {
    if (isOtherExpanded && otherTextareaRef.current) {
      otherTextareaRef.current.focus();
    }
  }, [isOtherExpanded]);

  const handleSelect = (optionId: string) => {
    setSelected(optionId);

    if (optionId === "other") {
      setIsOtherExpanded(true);
      if (otherText.trim()) {
        onAnswer({
          question_id: question.id,
          answer_type: "typed",
          selected_options: ["other"],
          free_text_answer: otherText,
        });
      }
    } else {
      setIsOtherExpanded(false);
      onAnswer({
        question_id: question.id,
        answer_type: "selected",
        selected_options: [optionId],
      });
    }
  };

  const handleOtherTextChange = (value: string) => {
    setOtherText(value);
    if (selected === "other" && value.trim()) {
      onAnswer({
        question_id: question.id,
        answer_type: "typed",
        selected_options: ["other"],
        free_text_answer: value,
      });
    }
  };

  const isOtherOption = (optionId: string) =>
    optionId === "other" || optionId.toLowerCase().includes("other");

  return (
    <div className="space-y-1">
      {/* Options list with minimal spacing */}
      <div className="space-y-1.5">
        {question.options.map((option) => {
          const isOther = isOtherOption(option.id);
          const isSelected = selected === option.id;

          return (
            <div key={option.id} className="group">
              {/* Option card */}
              <button
                type="button"
                onClick={() => handleSelect(option.id)}
                className={cn(
                  // Base styles - premium card feel
                  "w-full text-left px-4 py-3.5 rounded-xl",
                  "transition-all duration-200 ease-out",
                  "border outline-none",
                  // Touch target minimum
                  "min-h-[52px]",
                  // Selected state - subtle highlight
                  isSelected
                    ? [
                        "bg-primary/10 dark:bg-primary/15",
                        "border-primary/50 dark:border-primary/40",
                        "shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]",
                      ]
                    : [
                        // Default state - visible background
                        "bg-secondary dark:bg-secondary/80",
                        "border-border dark:border-border/50",
                        // Hover state - subtle lift
                        "hover:bg-secondary/80 dark:hover:bg-secondary",
                        "hover:border-border dark:hover:border-border/70",
                        "hover:shadow-sm",
                      ],
                  // Focus visible
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <div className="flex items-start gap-3.5">
                  {/* Custom radio button */}
                  <div className="mt-0.5">
                    <RadioIndicator isSelected={isSelected} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-sm font-medium leading-snug",
                        "transition-colors duration-200",
                        // Full opacity for readability
                        "text-foreground",
                      )}
                    >
                      {option.text}
                    </div>
                    {option.description && !isOther && (
                      <div
                        className={cn(
                          "text-[13px] leading-relaxed mt-1",
                          "transition-colors duration-200",
                          // Better contrast for descriptions
                          "text-muted-foreground",
                        )}
                      >
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Expandable "Other" text input */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-out",
                  isOther && isOtherExpanded && isSelected
                    ? "max-h-32 opacity-100 mt-2"
                    : "max-h-0 opacity-0 mt-0",
                )}
              >
                <div className="ml-[34px]">
                  <textarea
                    ref={otherTextareaRef}
                    value={otherText}
                    onChange={(e) => handleOtherTextChange(e.target.value)}
                    placeholder={t(I18nKey.CLARIFICATION$TYPE_ANSWER)}
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-lg",
                      "text-sm leading-relaxed resize-none",
                      "bg-background/80 dark:bg-background/50",
                      "border border-primary/30",
                      "placeholder:text-muted-foreground/50",
                      "transition-all duration-200",
                      "focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                      "focus:outline-none",
                    )}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skip button */}
      <SkipButton question={question} onSkip={onSkip} />
    </div>
  );
}

/**
 * Premium checkbox indicator with checkmark animation
 */
function CheckboxIndicator({ isSelected }: { isSelected: boolean }) {
  return (
    <div
      className={cn(
        "relative w-[18px] h-[18px] rounded-[5px] flex-shrink-0",
        "border-2 transition-all duration-200 ease-out",
        "flex items-center justify-center",
        isSelected
          ? "border-primary bg-primary"
          : "border-border/60 hover:border-border",
      )}
    >
      {/* Checkmark SVG with animation */}
      <svg
        className={cn(
          "w-3 h-3 text-primary-foreground",
          "transition-all duration-200 ease-out",
          isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

/**
 * MultiChoiceQuestion - Premium minimalist multi-select component
 */
export function MultiChoiceQuestion({
  question,
  onAnswer,
  onSkip,
}: QuestionProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [otherText, setOtherText] = useState("");
  const otherTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selected.has("other") && otherTextareaRef.current) {
      otherTextareaRef.current.focus();
    }
  }, [selected]);

  const isOtherOption = (optionId: string) =>
    optionId === "other" || optionId.toLowerCase().includes("other");

  const toggleOption = (optionId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelected(newSelected);

    const hasOther = newSelected.has("other");
    onAnswer({
      question_id: question.id,
      answer_type: hasOther && otherText.trim() ? "typed" : "selected",
      selected_options: Array.from(newSelected),
      free_text_answer: hasOther ? otherText : undefined,
    });
  };

  const handleOtherTextChange = (value: string) => {
    setOtherText(value);
    if (selected.has("other")) {
      onAnswer({
        question_id: question.id,
        answer_type: value.trim() ? "typed" : "selected",
        selected_options: Array.from(selected),
        free_text_answer: value,
      });
    }
  };

  return (
    <div className="space-y-1">
      <div className="space-y-1.5">
        {question.options.map((option) => {
          const isOther = isOtherOption(option.id);
          const isSelected = selected.has(option.id);

          return (
            <div key={option.id} className="group">
              <button
                type="button"
                onClick={() => toggleOption(option.id)}
                className={cn(
                  "w-full text-left px-4 py-3.5 rounded-xl",
                  "transition-all duration-200 ease-out",
                  "border outline-none min-h-[52px]",
                  isSelected
                    ? [
                        "bg-primary/10 dark:bg-primary/15",
                        "border-primary/50 dark:border-primary/40",
                        "shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]",
                      ]
                    : [
                        "bg-secondary dark:bg-secondary/80",
                        "border-border dark:border-border/50",
                        "hover:bg-secondary/80 dark:hover:bg-secondary",
                        "hover:border-border dark:hover:border-border/70",
                        "hover:shadow-sm",
                      ],
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5">
                    <CheckboxIndicator isSelected={isSelected} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-sm font-medium leading-snug",
                        "text-foreground",
                      )}
                    >
                      {option.text}
                    </div>
                    {option.description && !isOther && (
                      <div className="text-[13px] leading-relaxed mt-1 text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Expandable "Other" text input */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-out",
                  isOther && isSelected
                    ? "max-h-32 opacity-100 mt-2"
                    : "max-h-0 opacity-0 mt-0",
                )}
              >
                <div className="ml-[34px]">
                  <textarea
                    ref={otherTextareaRef}
                    value={otherText}
                    onChange={(e) => handleOtherTextChange(e.target.value)}
                    placeholder={t(I18nKey.CLARIFICATION$TYPE_ANSWER)}
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-lg",
                      "text-sm leading-relaxed resize-none",
                      "bg-background/80 dark:bg-background/50",
                      "border border-primary/30",
                      "placeholder:text-muted-foreground/50",
                      "transition-all duration-200",
                      "focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                      "focus:outline-none",
                    )}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <SkipButton question={question} onSkip={onSkip} />
    </div>
  );
}

/**
 * FreeTextQuestion - Premium minimalist textarea component
 */
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
    <div className="space-y-1">
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t(I18nKey.CLARIFICATION$TYPE_ANSWER)}
        className={cn(
          "w-full px-4 py-3.5 rounded-xl",
          "text-sm leading-relaxed resize-none text-foreground",
          "bg-secondary dark:bg-secondary/80",
          "border border-border dark:border-border/50",
          "placeholder:text-muted-foreground",
          "transition-all duration-200",
          "hover:border-border dark:hover:border-border/70 hover:shadow-sm",
          "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
          "focus:outline-none",
          "min-h-[100px]",
        )}
        rows={3}
      />
      <SkipButton question={question} onSkip={onSkip} />
    </div>
  );
}
