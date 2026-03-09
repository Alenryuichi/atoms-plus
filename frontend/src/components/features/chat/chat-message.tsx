import React from "react";
import { motion } from "framer-motion";
import { IconArrowBackUp, IconDots } from "@tabler/icons-react";
import { cn } from "#/lib/utils";
import { OpenHandsSourceType } from "#/types/core/base";
import { MarkdownRenderer } from "../markdown/markdown-renderer";
import { Card } from "#/components/ui/card";
import { AgentAvatar } from "./agent-avatar";

// Message animation variants - smoother spring for modern feel
const messageVariants = {
  hidden: (type: OpenHandsSourceType) => ({
    opacity: 0,
    y: 10,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

interface ChatMessageProps {
  type: OpenHandsSourceType;
  message: string;
  actions?: Array<{
    icon: React.ReactNode;
    onClick: () => void;
    tooltip?: string;
  }>;
  isFromPlanningAgent?: boolean;
}

export function ChatMessage({
  type,
  message,
  children,
  actions,
  isFromPlanningAgent = false,
}: React.PropsWithChildren<ChatMessageProps>) {
  const [isHovering, setIsHovering] = React.useState(false);
  const [isCopy, setIsCopy] = React.useState(false);

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(message);
    setIsCopy(true);
  };

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isCopy) {
      timeout = setTimeout(() => {
        setIsCopy(false);
      }, 2000);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [isCopy]);

  const isUserMessage = type === "user";
  const isAgentMessage = type === "agent";

  return (
    <motion.article
      data-testid={`${type}-message`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        "relative w-full flex flex-col gap-2 mb-6",
        isUserMessage && "items-end",
      )}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      custom={type}
    >
      {/* Atoms Plus: User message bubble with neutral glass styling */}
      {isUserMessage && (
        <div className="flex flex-col items-end max-w-[85%]">
          <Card
            className={cn(
              "px-4 py-2.5 bg-white/[0.05] backdrop-blur-md border-white/10 shadow-none",
              "rounded-2xl rounded-tr-sm",
            )}
          >
            <div
              className="text-[13px] text-white/90 leading-relaxed font-normal"
              style={{ whiteSpace: "normal", wordBreak: "break-word" }}
            >
              <MarkdownRenderer includeStandard>{message}</MarkdownRenderer>
            </div>
          </Card>
        </div>
      )}

      {/* Atoms Plus: Agent message with avatar header and airy content */}
      {isAgentMessage && (
        <div className="flex flex-col gap-3 w-full group">
          <AgentAvatar
            name="Alex"
            role={isFromPlanningAgent ? "Planner" : "Engineer"}
            size="sm"
          />

          <div className="flex flex-col gap-3 pl-10">
            <div
              className={cn(
                "text-[13px] text-white/90 leading-relaxed font-normal",
                isFromPlanningAgent &&
                  "bg-white/[0.03] p-4 rounded-xl border border-white/5 shadow-sm",
              )}
              style={{ whiteSpace: "normal", wordBreak: "break-word" }}
            >
              <MarkdownRenderer includeStandard>{message}</MarkdownRenderer>
            </div>

            {/* Action Bar - matches reference: reply, copy, more */}
            <div
              className={cn(
                "flex items-center gap-4 transition-opacity duration-200",
                isHovering ? "opacity-100" : "opacity-0",
              )}
            >
              <button className="text-white/40 hover:text-white/80 transition-colors">
                <IconArrowBackUp size={14} />
              </button>

              <button
                onClick={handleCopyToClipboard}
                className={cn(
                  "text-white/40 hover:text-white/80 transition-colors",
                  isCopy && "text-emerald-400",
                )}
              >
                {/* Simplified copy icon or text indicator */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>

              <button className="text-white/40 hover:text-white/80 transition-colors">
                <IconDots size={14} />
              </button>

              {actions?.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={action.onClick}
                  className="text-white/40 hover:text-white/80 transition-colors"
                >
                  {action.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {children}
    </motion.article>
  );
}
