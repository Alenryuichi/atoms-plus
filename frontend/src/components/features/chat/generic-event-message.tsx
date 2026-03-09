import React from "react";
import {
  IconChevronRight,
  IconCheck,
  IconLoader2,
  IconClock,
  IconTerminal,
  IconFile,
  IconBolt,
  IconBrowser,
  IconBrain,
  IconCheckbox,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ObservationResultStatus } from "./event-content-helpers/get-observation-result";
import { MarkdownRenderer } from "../markdown/markdown-renderer";
import { cn } from "#/lib/utils";
import { I18nKey } from "#/i18n/declaration";

interface GenericEventMessageProps {
  title: React.ReactNode;
  details: string | React.ReactNode;
  success?: ObservationResultStatus;
  initiallyExpanded?: boolean;
  actionType?: string; // e.g., "run", "edit", "call_tool_mcp"
}

/**
 * Get color scheme based on action type and status
 */
const getActionColorScheme = (
  actionType?: string,
  success?: ObservationResultStatus,
) => {
  // If running (no success status), use blue
  if (!success) {
    return {
      border: "border-blue-500/40 hover:border-blue-500/60",
      borderExpanded: "border-l-blue-500/50",
      text: "text-blue-400",
      bg: "from-blue-500/5",
      detailBorder: "border-blue-500/20",
      detailBg: "from-blue-500/5",
      statusBadge: "text-blue-400/60",
    };
  }

  // Success state - use emerald
  if (success === "success") {
    return {
      border: "border-emerald-500/40 hover:border-emerald-500/60",
      borderExpanded: "border-l-emerald-500/50",
      text: "text-emerald-400",
      bg: "from-emerald-500/5",
      detailBorder: "border-emerald-500/20",
      detailBg: "from-emerald-500/5",
      statusBadge: "text-emerald-400/60",
    };
  }

  // Timeout - use amber
  if (success === "timeout") {
    return {
      border: "border-amber-500/40 hover:border-amber-500/60",
      borderExpanded: "border-l-amber-500/50",
      text: "text-amber-400",
      bg: "from-amber-500/5",
      detailBorder: "border-amber-500/20",
      detailBg: "from-amber-500/5",
      statusBadge: "text-amber-400/60",
    };
  }

  // MCP tools - use purple
  if (actionType === "call_tool_mcp" || actionType === "mcp") {
    return {
      border: "border-purple-500/40 hover:border-purple-500/60",
      borderExpanded: "border-l-purple-500/50",
      text: "text-purple-400",
      bg: "from-purple-500/5",
      detailBorder: "border-purple-500/20",
      detailBg: "from-purple-500/5",
      statusBadge: "text-purple-400/60",
    };
  }

  // Default - use neutral
  return {
    border: "border-white/10 hover:border-white/20",
    borderExpanded: "border-l-amber-500/50",
    text: "text-white/70",
    bg: "from-white/5",
    detailBorder: "border-white/10",
    detailBg: "from-white/5",
    statusBadge: "text-white/60",
  };
};

/**
 * Get icon based on action type
 */
const getActionIcon = (actionType?: string) => {
  switch (actionType) {
    case "run":
    case "run_ipython":
      return IconTerminal;
    case "edit":
    case "write":
    case "read":
      return IconFile;
    case "call_tool_mcp":
    case "mcp":
      return IconBolt;
    case "browse":
    case "browse_interactive":
      return IconBrowser;
    case "think":
      return IconBrain;
    case "task_tracking":
      return IconCheckbox;
    default:
      return null;
  }
};

export function GenericEventMessage({
  title,
  details,
  success,
  initiallyExpanded = false,
  actionType,
}: GenericEventMessageProps) {
  const [showDetails, setShowDetails] = React.useState(initiallyExpanded);
  const { t } = useTranslation();

  const colorScheme = getActionColorScheme(actionType, success);
  const ActionIcon = getActionIcon(actionType);

  // Get status label
  const getStatusLabel = () => {
    if (success === "success")
      return t(I18nKey.AGENT_STATUS$RUNNING_TASK).replace(
        "Running task",
        "Success",
      );
    if (success === "timeout") return "Timeout";
    return "Running";
  };

  return (
    <div className="w-full flex flex-col mb-3 group/event">
      {/* Atoms Plus: Enhanced action bar with color coding */}
      <motion.button
        type="button"
        onClick={() => details && setShowDetails((prev) => !prev)}
        className={cn(
          "relative flex items-center justify-between w-full py-3 px-4 rounded-xl transition-all",
          "border-l-4 shadow-sm hover:shadow-md",
          colorScheme.border,
          details ? "cursor-pointer" : "cursor-default",
          showDetails && cn("bg-white/[0.02]", colorScheme.borderExpanded),
          "hover:bg-white/[0.05]",
        )}
        whileHover={{ scale: details ? 1.002 : 1 }}
        transition={{ duration: 0.15 }}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            initial={{ x: "-200%" }}
            whileHover={{ x: "200%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>

        <div className="flex items-center gap-3 overflow-hidden relative z-10">
          {/* Chevron indicator */}
          {details && (
            <motion.div
              className={cn(
                "transition-transform duration-200",
                colorScheme.text,
              )}
              animate={{ rotate: showDetails ? 90 : 0 }}
            >
              <IconChevronRight size={16} stroke={2.5} />
            </motion.div>
          )}

          {/* Action type icon */}
          {ActionIcon && (
            <ActionIcon size={16} className={colorScheme.text} stroke={2} />
          )}

          <span className={cn("text-[13px] font-semibold text-white/90")}>
            {title}
          </span>
        </div>

        {/* Status Indicator on the right */}
        <div className="flex items-center gap-2 pl-2 relative z-10">
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
              colorScheme.statusBadge,
            )}
          >
            {getStatusLabel()}
          </span>
          {success === "success" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <IconCheck
                size={18}
                className={cn(colorScheme.text, "animate-pulse")}
                stroke={3}
              />
            </motion.div>
          )}
          {success === "timeout" && (
            <IconClock size={16} className={colorScheme.text} />
          )}
          {!success && (
            <motion.div
              animate={{
                rotate: 360,
                filter: [
                  "drop-shadow(0 0 2px currentColor)",
                  "drop-shadow(0 0 4px currentColor)",
                  "drop-shadow(0 0 2px currentColor)",
                ],
              }}
              transition={{
                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                filter: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <IconLoader2
                size={16}
                className={colorScheme.text}
                stroke={2.5}
              />
            </motion.div>
          )}
        </div>
      </motion.button>

      {/* Expanded Details */}
      {showDetails && details && (
        <motion.div
          className={cn("mt-3 ml-8 pl-5 border-l-2", colorScheme.detailBorder)}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div
            className={cn(
              "text-[12px] leading-relaxed text-white/60 p-4 rounded-lg border",
              "bg-gradient-to-br to-transparent",
              colorScheme.detailBg,
              colorScheme.detailBorder.replace("border-", "border border-"),
            )}
          >
            {typeof details === "string" ? (
              <MarkdownRenderer>{details}</MarkdownRenderer>
            ) : (
              details
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
