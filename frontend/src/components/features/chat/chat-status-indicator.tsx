import { motion, AnimatePresence } from "framer-motion";
import { cn } from "#/utils/utils";
import DebugStackframeDot from "#/icons/debug-stackframe-dot.svg?react";

interface ChatStatusIndicatorProps {
  status: string;
  statusColor: string;
}

function ChatStatusIndicator({
  status,
  statusColor,
}: ChatStatusIndicatorProps) {
  return (
    <div
      data-testid="chat-status-indicator"
      className={cn(
        // Atoms Plus: Glass effect status indicator with amber accent
        "h-8 w-fit rounded-full px-3 py-1",
        "bg-black/50 backdrop-blur-sm",
        "border border-amber-500/20",
        "flex items-center gap-1",
        "shadow-lg shadow-black/20",
      )}
    >
      <AnimatePresence mode="wait">
        {/* Dot */}
        <motion.span
          key={`dot-${status}`}
          className="animate-[pulse_1.2s_ease-in-out_infinite]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DebugStackframeDot
            className="w-5 h-5 shrink-0"
            color={statusColor}
          />
        </motion.span>

        {/* Text */}
        <motion.span
          key={`text-${status}`}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 2 }}
          transition={{ duration: 0.3 }}
          className="font-medium text-xs text-neutral-300"
        >
          {status}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default ChatStatusIndicator;
