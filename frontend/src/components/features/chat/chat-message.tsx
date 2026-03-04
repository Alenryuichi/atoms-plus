import React from "react";
import { motion } from "framer-motion";
import { cn } from "#/lib/utils";
import { CopyToClipboardButton } from "#/components/shared/buttons/copy-to-clipboard-button";
import { OpenHandsSourceType } from "#/types/core/base";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";
import { MarkdownRenderer } from "../markdown/markdown-renderer";
import { Card } from "#/components/ui/card";

// Message animation variants - smoother spring for modern feel
const messageVariants = {
  hidden: (type: OpenHandsSourceType) => ({
    opacity: 0,
    x: type === "user" ? 16 : -16,
    y: 8,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 24,
      duration: 0.25,
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
        "relative w-fit last:mb-4 flex flex-col gap-2",
        // User message: right-aligned with primary accent
        isUserMessage && "max-w-[80%] self-end",
        // Agent message: left-aligned, full width
        isAgentMessage && "w-full max-w-full",
      )}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      custom={type}
    >
      {/* Atoms Plus: User message bubble with gradient accent */}
      {isUserMessage && (
        <Card
          className={cn(
            "px-4 py-3 border-[var(--atoms-accent-primary)]/30 bg-[var(--atoms-accent-primary)]/10",
            "rounded-2xl rounded-tr-md",
            "shadow-lg shadow-[var(--atoms-accent-primary)]/5",
          )}
        >
          <div
            className="text-sm text-[var(--atoms-text-primary)] leading-relaxed"
            style={{ whiteSpace: "normal", wordBreak: "break-word" }}
          >
            <MarkdownRenderer includeStandard>{message}</MarkdownRenderer>
          </div>
        </Card>
      )}

      {/* Atoms Plus: Agent message with dark styling */}
      {isAgentMessage && (
        <div
          className={cn(
            "mt-3",
            // Planning agent has special gradient border
            isFromPlanningAgent &&
              "border border-[var(--atoms-accent-secondary)]/30 bg-[var(--atoms-bg-card)] px-4 py-3 rounded-xl shadow-md",
          )}
        >
          <div
            className="text-sm text-[var(--atoms-text-primary)] leading-relaxed"
            style={{ whiteSpace: "normal", wordBreak: "break-word" }}
          >
            <MarkdownRenderer includeStandard>{message}</MarkdownRenderer>
          </div>
        </div>
      )}

      {/* Atoms Plus: Hover actions with dark styling */}
      <div
        className={cn(
          "absolute -top-2 z-10",
          isUserMessage ? "-left-2" : "-right-2",
          !isHovering ? "hidden" : "flex",
          "items-center gap-1 bg-[var(--atoms-bg-card)] rounded-lg shadow-lg border border-[var(--atoms-border)] p-1",
        )}
      >
        {actions?.map((action, index) =>
          action.tooltip ? (
            <StyledTooltip key={index} content={action.tooltip} placement="top">
              <button
                type="button"
                onClick={action.onClick}
                className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                aria-label={action.tooltip}
              >
                {action.icon}
              </button>
            </StyledTooltip>
          ) : (
            <button
              key={index}
              type="button"
              onClick={action.onClick}
              className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
              aria-label={`Action ${index + 1}`}
            >
              {action.icon}
            </button>
          ),
        )}

        <CopyToClipboardButton
          isHidden={!isHovering}
          isDisabled={isCopy}
          onClick={handleCopyToClipboard}
          mode={isCopy ? "copied" : "copy"}
        />
      </div>

      {children}
    </motion.article>
  );
}
