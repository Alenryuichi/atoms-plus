import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { useResearchStore } from "#/stores/research-store";

interface ResearchCompleteCardProps {
  onStartBuilding: () => void;
  onEditReport: () => void;
}

export function ResearchCompleteCard({
  onStartBuilding,
  onEditReport,
}: ResearchCompleteCardProps) {
  const { t } = useTranslation();
  const result = useResearchStore((s) => s.result);
  const query = useResearchStore((s) => s.query);
  const phase = useResearchStore((s) => s.phase);
  const isConfirmed = phase === "completed";

  if (!result) return null;

  const lines = result.report.split("\n").filter((l) => l.trim());
  const title =
    lines.find((l) => l.startsWith("# "))?.replace(/^#\s+/, "") || query;
  const summaryLine =
    lines.find(
      (l) =>
        !l.startsWith("#") &&
        l.length > 30 &&
        !l.startsWith("---") &&
        !l.startsWith("**"),
    ) || "";

  const formatTime = (s: number) => {
    if (s < 60) return `${Math.round(s)}s`;
    return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
            <span className="text-lg">✅</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">
              {t(I18nKey.ATOMS$RESEARCH_COMPLETE)}
            </h3>
            <p className="text-white/50 text-xs truncate">{title}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-emerald-400 text-xs font-medium block">
              {result.total_sources} sources
            </span>
            <span className="text-white/30 text-[10px] font-mono">
              {formatTime(result.execution_time)}
            </span>
          </div>
        </div>

        {/* Brief summary */}
        {summaryLine && (
          <p className="text-white/50 text-xs leading-relaxed line-clamp-2">
            {summaryLine}
          </p>
        )}

        {/* Action buttons or confirmed status */}
        {isConfirmed ? (
          <div className="flex items-center gap-2 pt-1 text-emerald-400/70 text-xs">
            <span>🚀</span>
            <span>Building started — agent is working on it</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onStartBuilding}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium
                bg-gradient-to-r from-amber-500 to-orange-500
                text-white shadow-lg shadow-amber-500/20
                hover:shadow-amber-500/30 hover:brightness-110
                active:scale-[0.98] transition-all duration-200"
            >
              {t(I18nKey.ATOMS$RESEARCH_START_BUILDING)}
            </button>
            <button
              type="button"
              onClick={onEditReport}
              className="px-4 py-2 rounded-xl text-sm font-medium
                border border-white/10 text-white/60
                hover:text-white/80 hover:border-white/20 hover:bg-white/5
                active:scale-[0.98] transition-all duration-200"
            >
              {t(I18nKey.ATOMS$RESEARCH_VIEW_FULL)}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
