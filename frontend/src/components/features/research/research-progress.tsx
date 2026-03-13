import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { useResearchStore } from "#/stores/research-store";
import { useElapsedTimer, formatElapsed } from "#/hooks/use-elapsed-timer";

const EVENT_ICONS: Record<string, string> = {
  started: "🚀",
  section_started: "📖",
  searching: "🔍",
  summarizing: "📝",
  reflecting: "🤔",
  section_completed: "✅",
  completed: "🎉",
  error: "❌",
};

interface ResearchProgressProps {
  onCancel?: () => void;
  onDismiss?: () => void;
}

export function ResearchProgress({ onCancel, onDismiss }: ResearchProgressProps) {
  const { t } = useTranslation();
  const { phase, progress, currentSection, progressMessage, progressEvents, sections } =
    useResearchStore();
  const elapsed = useElapsedTimer(phase);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runningCount = sections.filter((s) => s.status === "running").length;
  const doneCount = sections.filter((s) => s.status === "done").length;
  const totalSections = sections.length;

  const handleCancelClick = useCallback(() => {
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      cancelTimerRef.current = setTimeout(() => setConfirmingCancel(false), 3000);
    } else {
      if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
      setConfirmingCancel(false);
      onCancel?.();
    }
  }, [confirmingCancel, onCancel]);

  useEffect(() => {
    return () => {
      if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    };
  }, []);

  if (phase === "idle") return null;

  const percentage = Math.round(progress * 100);
  const estimatedTotal = progress > 0.05 ? Math.round(elapsed / progress) : 180;
  const remaining = Math.max(0, estimatedTotal - elapsed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <div className="rounded-lg border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <span className="text-lg">🔬</span>
              </div>
              {(phase === "researching" || phase === "connecting") && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-amber-400/50"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">
                {t(I18nKey.ATOMS$RESEARCH_TITLE)}
              </h3>
              <p className="text-white/50 text-xs">
                {phase === "connecting" && t(I18nKey.ATOMS$RESEARCH_CONNECTING)}
                {phase === "researching" && (
                  totalSections > 0
                    ? `Researching ${totalSections} sections (${runningCount} running, ${doneCount} done)`
                    : currentSection || t(I18nKey.ATOMS$RESEARCH_ANALYZING)
                )}
                {(phase === "completed" || phase === "awaiting_confirmation") && t(I18nKey.ATOMS$RESEARCH_COMPLETE)}
                {phase === "error" && t(I18nKey.ATOMS$RESEARCH_FAILED)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Timer + estimate */}
            {(phase === "researching" || phase === "connecting") && (
              <div className="text-right">
                <span className="text-amber-400 font-mono text-sm font-semibold block">
                  {percentage}%
                </span>
                <span className="text-white/30 text-[10px] font-mono">
                  {formatElapsed(elapsed)}
                  {progress > 0.05 && ` · ~${formatElapsed(remaining)} left`}
                </span>
              </div>
            )}
            {/* Cancel button removed from header — now at bottom of card */}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          {phase === "connecting" ? (
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500/50 to-orange-500/50"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ width: "40%" }}
            />
          ) : (
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
              initial={false}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}
        </div>

        {/* Current status message */}
        <AnimatePresence mode="wait">
          {progressMessage && (
            <motion.p
              key={progressMessage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-white/60 text-xs leading-relaxed"
            >
              {progressMessage}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Event log (last 4 events) */}
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {progressEvents.slice(-4).map((event, i) => (
            <motion.div
              key={`${event.event}-${i}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs text-white/40"
            >
              <span>{EVENT_ICONS[event.event] || "•"}</span>
              <span className="truncate">
                {event.message || event.event}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Cancel button — text style with two-step confirmation */}
        {onCancel && (phase === "researching" || phase === "connecting") && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleCancelClick}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                confirmingCancel
                  ? "text-red-400 bg-red-500/10 border border-red-500/20"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              {confirmingCancel
                ? t(I18nKey.ATOMS$RESEARCH_CANCEL) + "?"
                : t(I18nKey.ATOMS$RESEARCH_CANCEL)}
            </button>
          </div>
        )}

        {/* Dismiss button in error state */}
        {phase === "error" && onDismiss && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-white/30 hover:text-white/50 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
