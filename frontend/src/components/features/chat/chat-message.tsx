import React from "react";
import { motion } from "framer-motion";
import { IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { cn } from "#/lib/utils";
import { OpenHandsSourceType } from "#/types/core/base";
import { MarkdownRenderer } from "../markdown/markdown-renderer";
import { Card } from "#/components/ui/card";
import { AgentAvatar } from "./agent-avatar";
import { I18nKey } from "#/i18n/declaration";

// Message animation variants - slide in from bottom
const messageVariants = {
  hidden: (type: OpenHandsSourceType) => ({
    opacity: 0,
    y: 20,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
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
  const { t } = useTranslation();
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
      {/* Atoms Plus: User message bubble with subtle gradient border */}
      {isUserMessage && (
        <div className="flex flex-col items-end max-w-[85%] gap-1">
          <div className="relative group/message">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-2xl rounded-tr-sm bg-gradient-to-br from-amber-500/20 via-transparent to-purple-500/20 opacity-50" />

            <Card
              className={cn(
                "relative px-4 py-2.5 bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-md border border-transparent shadow-none",
                "rounded-2xl rounded-tr-sm",
              )}
            >
              <div
                className="text-[13px] text-white/95 leading-relaxed font-medium"
                style={{ whiteSpace: "normal", wordBreak: "break-word" }}
              >
                <MarkdownRenderer includeStandard>{message}</MarkdownRenderer>
              </div>
            </Card>

            {/* Copy button (appears on hover) */}
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className={cn(
                "absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md",
                "bg-black/60 hover:bg-black/80 border border-white/10",
                "flex items-center justify-center transition-all",
                "opacity-0 group-hover/message:opacity-100",
                isCopy ? "text-emerald-400" : "text-white/60 hover:text-white",
              )}
            >
              {isCopy ? (
                <IconCheck size={14} stroke={2.5} />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>

          {/* Message status */}
          <div className="flex items-center gap-1 mr-2">
            <IconCheck size={12} className="text-emerald-400" stroke={3} />
            <span className="text-[10px] text-white/40">
              {t(I18nKey.CHAT_INTERFACE$MESSAGE_SENT)}
            </span>
          </div>
        </div>
      )}

      {/* Atoms Plus: Agent message with avatar and enhanced content */}
      {isAgentMessage && (
        <div className="flex flex-col gap-3 w-full group">
          <AgentAvatar
            name="Alex"
            role={isFromPlanningAgent ? "Planner" : "Engineer"}
            size="sm"
          />

          <div className="flex flex-col gap-3 pl-10">
            <div className="relative group/message">
              <div
                className={cn(
                  "text-[13px] text-white/95 leading-relaxed font-medium",
                  isFromPlanningAgent &&
                    "bg-white/[0.02] p-4 rounded-xl border border-white/5",
                )}
                style={{ whiteSpace: "normal", wordBreak: "break-word" }}
              >
                <MarkdownRenderer includeStandard>{message}</MarkdownRenderer>
              </div>

              {/* Copy button (appears on hover) */}
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className={cn(
                  "absolute -left-8 top-2 w-6 h-6 rounded-md",
                  "bg-black/60 hover:bg-black/80 border border-white/10",
                  "flex items-center justify-center transition-all",
                  "opacity-0 group-hover/message:opacity-100",
                  isCopy
                    ? "text-emerald-400"
                    : "text-white/60 hover:text-white",
                )}
              >
                {isCopy ? (
                  <IconCheck size={14} stroke={2.5} />
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>

            {/* Action Bar - simplified */}
            {actions && actions.length > 0 && (
              <div
                className={cn(
                  "flex items-center gap-4 transition-opacity duration-200",
                  isHovering ? "opacity-100" : "opacity-0",
                )}
              >
                {actions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={action.onClick}
                    className="text-white/40 hover:text-white/80 transition-colors"
                    title={action.tooltip}
                  >
                    {action.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {children}
    </motion.article>
  );
}
