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
      border: "border-white/[0.08] hover:border-white/15",
      borderExpanded: "border-l-white/10",
      text: "text-blue-300",
      bg: "bg-white/[0.03]",
      detailBorder: "border-white/[0.08]",
      detailBg: "bg-white/[0.025]",
      statusBadge: "text-blue-300/70",
    };
  }

  // Success state - use emerald
  if (success === "success") {
    return {
      border: "border-white/[0.08] hover:border-white/15",
      borderExpanded: "border-l-emerald-400/40",
      text: "text-emerald-400",
      bg: "bg-white/[0.03]",
      detailBorder: "border-white/[0.08]",
      detailBg: "bg-white/[0.025]",
      statusBadge: "text-emerald-400/60",
    };
  }

  // Timeout - use amber
  if (success === "timeout") {
    return {
      border: "border-white/[0.08] hover:border-white/15",
      borderExpanded: "border-l-amber-300/40",
      text: "text-amber-400",
      bg: "bg-white/[0.03]",
      detailBorder: "border-white/[0.08]",
      detailBg: "bg-white/[0.025]",
      statusBadge: "text-amber-400/60",
    };
  }

  // MCP tools - use purple
  if (actionType === "call_tool_mcp" || actionType === "mcp") {
    return {
      border: "border-white/[0.08] hover:border-white/15",
      borderExpanded: "border-l-violet-400/40",
      text: "text-purple-400",
      bg: "bg-white/[0.03]",
      detailBorder: "border-white/[0.08]",
      detailBg: "bg-white/[0.025]",
      statusBadge: "text-purple-400/60",
    };
  }

  // Default - use neutral
  return {
    border: "border-white/[0.08] hover:border-white/15",
    borderExpanded: "border-l-white/10",
    text: "text-white/70",
    bg: "bg-white/[0.03]",
    detailBorder: "border-white/[0.08]",
    detailBg: "bg-white/[0.025]",
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
      <motion.button
        type="button"
        onClick={() => details && setShowDetails((prev) => !prev)}
        className={cn(
          "relative flex w-full items-center justify-between rounded-2xl px-4 py-3 transition-all",
          "border shadow-none",
          colorScheme.border,
          details ? "cursor-pointer" : "cursor-default",
          colorScheme.bg,
          showDetails && cn("bg-white/[0.05]", colorScheme.borderExpanded),
          "hover:bg-white/[0.05]",
        )}
        whileHover={{ y: details ? -1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-center gap-3 overflow-hidden relative z-10">
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

          {ActionIcon && (
            <ActionIcon size={16} className={colorScheme.text} stroke={2} />
          )}

          <span className={cn("text-[13px] font-semibold text-white/88")}>
            {title}
          </span>
        </div>

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
              animate={{ rotate: 360 }}
              transition={{
                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
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
          className={cn("mt-3 ml-6 border-l pl-4", colorScheme.detailBorder)}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div
            className={cn(
              "rounded-xl border p-4 text-[12px] leading-relaxed text-white/62",
              colorScheme.detailBg,
              colorScheme.detailBorder,
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
