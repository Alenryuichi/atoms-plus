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
  hidden: () => ({
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
        "relative mb-8 flex w-full flex-col gap-3",
        isUserMessage && "items-end",
      )}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      custom={type}
    >
      {/* Atoms Plus: User message bubble with subtle gradient border */}
      {isUserMessage && (
        <div className="flex max-w-[85%] flex-col items-end gap-2">
          <div className="relative group/message">
            <Card
              className={cn(
                "relative rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 shadow-none backdrop-blur-md",
              )}
            >
              <div
                className="text-[14px] font-medium leading-6 text-white/92"
                style={{ whiteSpace: "normal", wordBreak: "break-word" }}
              >
                <MarkdownRenderer includeStandard>{message}</MarkdownRenderer>
              </div>
            </Card>

            {/* Copy button (appears on hover) */}
            <button
              type="button"
              onClick={handleCopyToClipboard}
              aria-label={t(I18nKey.BUTTON$COPY)}
              className={cn(
                "absolute -left-10 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-all",
                "opacity-0 group-hover/message:opacity-100 group-focus-within/message:opacity-100",
                isCopy
                  ? "text-emerald-400"
                  : "text-white/55 hover:border-white/15 hover:bg-white/[0.07] hover:text-white",
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
          <div className="mr-2 flex items-center gap-1.5">
            <IconCheck size={12} className="text-emerald-400" stroke={3} />
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
              {t(I18nKey.CHAT_INTERFACE$MESSAGE_SENT)}
            </span>
          </div>
        </div>
      )}

      {/* Atoms Plus: Agent message with avatar and enhanced content */}
      {isAgentMessage && (
        <div className="group flex w-full flex-col gap-3">
          <AgentAvatar
            name="Alex"
            role={isFromPlanningAgent ? "Planner" : "Engineer"}
            size="sm"
          />

          <div className="flex flex-col gap-3 pl-10">
            <div className="relative group/message">
              <div
                className={cn(
                  "max-w-[78ch] text-[14px] font-medium leading-7 text-white/88",
                  isFromPlanningAgent &&
                    "rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 backdrop-blur-sm",
                )}
                style={{ whiteSpace: "normal", wordBreak: "break-word" }}
              >
                <MarkdownRenderer includeStandard>{message}</MarkdownRenderer>
              </div>

              {/* Copy button (appears on hover) */}
              <button
                type="button"
                onClick={handleCopyToClipboard}
                aria-label={t(I18nKey.BUTTON$COPY)}
                className={cn(
                  "absolute -left-10 top-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-all",
                  "opacity-0 group-hover/message:opacity-100 group-focus-within/message:opacity-100",
                  isCopy
                    ? "text-emerald-400"
                    : "text-white/55 hover:border-white/15 hover:bg-white/[0.07] hover:text-white",
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
                    className="rounded-lg px-1 py-1 text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
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
