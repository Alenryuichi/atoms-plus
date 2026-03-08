import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import { useTeamModeStore } from "#/stores/team-mode-store";
import { AGENT_DISPLAY_INFO } from "#/api/team-mode-service/team-mode-service.types";
import { cn } from "#/utils/utils";

interface TeamModeToggleProps {
  /** Compact mode for inline usage */
  compact?: boolean;
}

/**
 * Toggle switch to enable/disable Team Mode
 * Shows current agent and status when running
 */
export function TeamModeToggle({ compact = false }: TeamModeToggleProps) {
  const { t } = useTranslation();
  const { isEnabled, toggleEnabled, isRunning, currentAgent, status, error } =
    useTeamModeStore();

  // Determine display state
  const isCompleted = status?.status === "completed";
  const hasError = status?.status === "error" || !!error;
  const agentInfo = currentAgent ? AGENT_DISPLAY_INFO[currentAgent] : null;

  // Get status-based styling
  const getStatusStyles = () => {
    if (hasError) {
      return "bg-red-500/20 border-red-500/30 text-red-400";
    }
    if (isCompleted) {
      return "bg-green-500/20 border-green-500/30 text-green-400";
    }
    if (isRunning && agentInfo) {
      return `bg-opacity-20 border-opacity-30`;
    }
    if (isEnabled) {
      return "bg-purple-500/20 border-purple-500/30 text-purple-400";
    }
    return "bg-black/50 border-neutral-600/30 text-neutral-400 hover:border-purple-500/30 hover:text-purple-400";
  };

  // Get tooltip content
  const getTooltipContent = () => {
    if (hasError) {
      return error || status?.error || t("TEAM_MODE$ERROR_TOOLTIP");
    }
    if (isCompleted) {
      return t("TEAM_MODE$COMPLETED_TOOLTIP");
    }
    if (isRunning && agentInfo) {
      const progress = status
        ? `${status.iteration}/${status.max_iterations}`
        : "";
      return `${agentInfo.name}: ${agentInfo.description}${progress ? ` (${progress})` : ""}`;
    }
    return isEnabled
      ? t("TEAM_MODE$ACTIVE_TOOLTIP")
      : t("TEAM_MODE$ENABLE_TOOLTIP");
  };

  // Get status icon - avoid nested ternaries
  const getStatusIcon = () => {
    if (hasError) return "⚠️";
    if (isCompleted) return "✅";
    if (isRunning && agentInfo) return agentInfo.icon;
    return "👥";
  };

  // Get tooltip border class - avoid nested ternaries
  const getTooltipBorderClass = () => {
    if (hasError) return "border-red-500/30";
    if (isCompleted) return "border-green-500/30";
    return "border-purple-500/20";
  };

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
              "border",
              "flex items-center gap-2",
              "shadow-lg shadow-black/20",
              "cursor-pointer",
              "transition-all duration-300",
              "text-xs font-medium",
              getStatusStyles(),
              isRunning && "cursor-default",
            )}
            style={
              isRunning && agentInfo
                ? {
                    backgroundColor: `${agentInfo.color}20`,
                    borderColor: `${agentInfo.color}50`,
                    color: agentInfo.color,
                  }
                : undefined
            }
          >
            {/* Icon with animation */}
            <AnimatePresence mode="wait">
              <motion.span
                key={isRunning && agentInfo ? agentInfo.icon : "team"}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="text-sm"
              >
                {getStatusIcon()}
              </motion.span>
            </AnimatePresence>

            {/* Label with animation */}
            <AnimatePresence mode="wait">
              <motion.span
                key={isRunning && agentInfo ? currentAgent : "team"}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap"
              >
                {isRunning && agentInfo ? agentInfo.name : t("TEAM_MODE$TEAM")}
              </motion.span>
            </AnimatePresence>

            {/* Status indicator */}
            {isRunning && (
              <div
                className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                style={{
                  borderColor: agentInfo
                    ? `${agentInfo.color}50`
                    : "currentColor",
                  borderTopColor: "transparent",
                }}
              />
            )}
            {!isRunning && isEnabled && !hasError && !isCompleted && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className={cn(
            "bg-black/90 backdrop-blur-md max-w-xs",
            getTooltipBorderClass(),
          )}
        >
          <div className="text-sm">
            {getTooltipContent()}
            {isRunning && status && (
              <div className="text-xs text-neutral-400 mt-1">
                {t("TEAM_MODE$PROGRESS")}: {status.iteration}/
                {status.max_iterations}
              </div>
            )}
          </div>
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
