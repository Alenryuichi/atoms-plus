import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { useResearchStore } from "#/stores/research-store";

interface ResearchToggleProps {
  compact?: boolean;
}

export function ResearchToggle({ compact = false }: ResearchToggleProps) {
  const { t } = useTranslation();
  const { isResearchMode, setResearchMode } = useResearchStore();

  return (
    <button
      type="button"
      onClick={() => setResearchMode(!isResearchMode)}
      className={`flex items-center gap-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
        compact ? "px-2 py-1" : "px-3 py-1.5"
      } ${
        isResearchMode
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          : "bg-white/5 text-white/40 border border-white/10 hover:text-white/60 hover:border-white/20"
      }`}
      title={
        isResearchMode
          ? t(I18nKey.ATOMS$RESEARCH_ENABLED_TOOLTIP)
          : t(I18nKey.ATOMS$RESEARCH_DISABLED_TOOLTIP)
      }
    >
      <motion.span
        animate={isResearchMode ? { rotate: [0, 15, -15, 0] } : {}}
        transition={{ duration: 0.5 }}
        className={compact ? "text-xs" : ""}
      >
        🔬
      </motion.span>
      {!compact && (
        <span>{t(I18nKey.ATOMS$RESEARCH_LABEL)}</span>
      )}
      {isResearchMode && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-1.5 h-1.5 rounded-full bg-amber-400"
        />
      )}
    </button>
  );
}
