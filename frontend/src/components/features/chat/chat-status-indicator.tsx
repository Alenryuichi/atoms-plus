import { motion } from "framer-motion";
import { cn } from "#/utils/utils";

interface ChatStatusIndicatorProps {
  status: string;
  statusColor: string;
}

// Get status color class based on hex color
const getStatusColorClass = (hexColor: string): string => {
  switch (hexColor.toLowerCase()) {
    case "#bcff8c": // Green - Running
      return "bg-emerald-500";
    case "#ffd600": // Yellow - Initializing/Pausing
      return "bg-amber-500";
    case "#ff684e": // Red - Error
      return "bg-red-500";
    case "#ffffff": // White - Stopped
      return "bg-neutral-500";
    default:
      return "bg-neutral-500";
  }
};

// Get gradient background based on status
const getGradientBg = (hexColor: string): string => {
  switch (hexColor.toLowerCase()) {
    case "#bcff8c": // Green - Running
      return "from-emerald-500/10";
    case "#ffd600": // Yellow - Initializing
      return "from-amber-500/10";
    case "#ff684e": // Red - Error
      return "from-red-500/10";
    default:
      return "from-neutral-500/10";
  }
};

// Get border color based on status
const getBorderColor = (hexColor: string): string => {
  switch (hexColor.toLowerCase()) {
    case "#bcff8c": // Green - Running
      return "border-emerald-500/20";
    case "#ffd600": // Yellow - Initializing
      return "border-amber-500/20";
    case "#ff684e": // Red - Error
      return "border-red-500/20";
    default:
      return "border-neutral-500/20";
  }
};

function ChatStatusIndicator({
  status,
  statusColor,
}: ChatStatusIndicatorProps) {
  const dotColorClass = getStatusColorClass(statusColor);
  const gradientBg = getGradientBg(statusColor);
  const borderColor = getBorderColor(statusColor);
  const isRunning = statusColor.toLowerCase() === "#bcff8c";
  const isInitializing = statusColor.toLowerCase() === "#ffd600";

  return (
    <div
      data-testid="chat-status-indicator"
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2 transition-all",
        "bg-white/[0.03]",
        gradientBg,
        borderColor,
      )}
    >
      {/* Status dot with animation */}
      <div className="relative">
        <div className={cn("w-3 h-3 rounded-full", dotColorClass)} />
        {isRunning && (
          <div
            className={cn(
              "absolute inset-0 w-3 h-3 rounded-full animate-ping",
              dotColorClass,
            )}
          />
        )}
        {isInitializing && (
          <div
            className={cn(
              "absolute inset-0 w-3 h-3 rounded-full",
              dotColorClass,
              "animate-[pulse_1.2s_ease-in-out_infinite]",
            )}
          />
        )}
      </div>

      {/* Status text */}
      <div className="flex-1">
        <motion.div
          key={`text-${status}`}
          className="text-xs font-medium uppercase tracking-[0.16em] text-white/58"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {status}
        </motion.div>
      </div>
    </div>
  );
}

export default ChatStatusIndicator;
