import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import { useTeamModeStore } from "#/stores/team-mode-store";
import { cn } from "#/utils/utils";

interface TeamModeToggleProps {
  /** Compact mode for inline usage */
  compact?: boolean;
}

/**
 * Toggle switch to enable/disable Team Mode
 */
export function TeamModeToggle({ compact = false }: TeamModeToggleProps) {
  const { t } = useTranslation();
  const { isEnabled, toggleEnabled, isRunning } = useTeamModeStore();

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Atoms Plus: 统一玻璃效果 pill，与 AutoRoleIndicator 高度一致 (h-8) */}
          <button
            type="button"
            aria-label={t("TEAM_MODE$TOGGLE_LABEL")}
            onClick={toggleEnabled}
            disabled={isRunning}
            className={cn(
              // Match AutoRoleIndicator height and style
              "h-8 w-fit rounded-full px-3 py-1",
              "backdrop-blur-sm",
              "flex items-center gap-2",
              "shadow-lg shadow-black/20",
              "cursor-pointer",
              "transition-all duration-300",
              "text-xs font-medium",
              isEnabled
                ? "bg-purple-500/20 border border-purple-500/30 text-purple-400"
                : "bg-black/50 border border-neutral-600/30 text-neutral-400 hover:border-purple-500/30 hover:text-purple-400",
              isRunning && "opacity-50 cursor-not-allowed",
            )}
          >
            <span className="text-sm">👥</span>
            <span>{t("TEAM_MODE$TEAM")}</span>
            {isEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-black/90 backdrop-blur-md border-purple-500/20"
        >
          {isEnabled
            ? t("TEAM_MODE$ACTIVE_TOOLTIP")
            : t("TEAM_MODE$ENABLE_TOOLTIP")}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Custom toggle switch */}
      <button
        type="button"
        role="switch"
        aria-label={t("TEAM_MODE$TOGGLE_LABEL")}
        aria-checked={isEnabled}
        onClick={toggleEnabled}
        disabled={isRunning}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isEnabled
            ? "bg-gradient-to-r from-purple-500 to-blue-500"
            : "bg-default-200",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform",
            isEnabled ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {t("TEAM_MODE$TITLE")}
        </span>
        <span className="text-xs text-default-500">
          {isEnabled
            ? t("TEAM_MODE$ACTIVE_DESCRIPTION")
            : t("TEAM_MODE$ENABLE_DESCRIPTION")}
        </span>
      </div>
    </div>
  );
}
