import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { useResearchStore } from "#/stores/research-store";
import { MarkdownRenderer } from "#/components/features/markdown/markdown-renderer";

interface ResearchReportProps {
  onStartBuilding: (report: string) => void;
  onDiscard: () => void;
}

export function ResearchReport({
  onStartBuilding,
  onDiscard,
}: ResearchReportProps) {
  const { t } = useTranslation();
  const { result, query } = useResearchStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!result) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="rounded-2xl border border-amber-500/20 bg-black/30 backdrop-blur-xl overflow-hidden">
        {/* Report header */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-base">📋</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  {t(I18nKey.ATOMS$RESEARCH_COMPLETE)}
                </h3>
                <p className="text-white/40 text-xs truncate max-w-[300px]">{query}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>
                {t(I18nKey.ATOMS$RESEARCH_SOURCES, {
                  count: result.total_sources,
                })}
              </span>
              <span>·</span>
              <span>{formatTime(result.execution_time)}</span>
            </div>
          </div>
        </div>

        {/* Report content — collapsible preview */}
        <div className="relative">
          <div
            className={`px-6 py-4 overflow-hidden transition-all duration-300 ${
              isExpanded ? "max-h-[60vh] overflow-y-auto" : "max-h-48"
            }`}
          >
            <div className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed">
              <MarkdownRenderer
                content={result.report}
                includeHeadings
                includeStandard
              />
            </div>
          </div>

          {!isExpanded && (
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Expand / collapse toggle */}
        <div className="flex justify-center py-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-amber-400/60 hover:text-amber-400 transition-colors px-4 py-1 cursor-pointer"
          >
            {isExpanded
              ? t(I18nKey.ATOMS$RESEARCH_SHOW_LESS)
              : t(I18nKey.ATOMS$RESEARCH_READ_FULL)}
          </button>
        </div>

        {/* Action buttons */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onStartBuilding(result.report)}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-sm hover:from-amber-400 hover:to-orange-400 transition-all duration-200 shadow-lg shadow-amber-500/20"
            >
              <span>⚡</span>
              {t(I18nKey.ATOMS$RESEARCH_START_BUILDING)}
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white/80 hover:border-white/20 transition-all duration-200"
            >
              {t(I18nKey.ATOMS$RESEARCH_DISCARD)}
            </button>
          </div>
          <p className="text-[11px] text-white/25 text-center">
            {t(I18nKey.ATOMS$RESEARCH_PANEL_HINT)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
