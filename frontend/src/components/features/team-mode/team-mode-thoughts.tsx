import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTeamModeStore } from "#/stores/team-mode-store";
import {
  AGENT_DISPLAY_INFO,
  AgentThought,
} from "#/api/team-mode-service/team-mode-service.types";
import { cn } from "#/utils/utils";
import ArrowDown from "#/icons/angle-down-solid.svg?react";
import ArrowUp from "#/icons/angle-up-solid.svg?react";
import { MarkdownRenderer } from "#/components/features/markdown/markdown-renderer";

/**
 * Single thought message with collapsible details.
 * Matches OpenHands ExpandableMessage pattern.
 */
function ThoughtMessage({
  thought,
  isLatest,
}: {
  thought: AgentThought;
  isLatest: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const info = AGENT_DISPLAY_INFO[thought.role];
  const isThinking = thought.status === "thinking";

  // Check if details are different from summary (has meaningful extra content)
  const hasDetails =
    thought.content &&
    thought.summary &&
    thought.content !== thought.summary &&
    thought.content.length > thought.summary.length + 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex w-full flex-col gap-2 px-4 py-3"
    >
      {/* Agent message bubble - similar to ChatMessage but with agent identity */}
      <div className="flex items-start gap-3">
        {/* Agent avatar */}
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-lg",
            "bg-gradient-to-br from-neutral-800 to-neutral-900",
            "border border-neutral-700/50",
          )}
        >
          {info.icon}
        </div>

        {/* Message content */}
        <div className="flex flex-col gap-1 flex-1">
          {/* Agent name and status */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold"
              style={{ color: info.color }}
            >
              {info.name}
            </span>
            <span className="text-xs text-neutral-500">{info.title}</span>
            {isThinking && isLatest && (
              <motion.span
                className="text-xs text-amber-500"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                •••
              </motion.span>
            )}
          </div>

          {/* Summary content - concise, user-friendly */}
          <div className="flex items-start gap-1">
            <p className="text-sm text-neutral-300 leading-relaxed flex-1">
              {thought.summary || thought.content}
            </p>
            {/* Expand/collapse button */}
            {hasDetails && (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex-shrink-0 p-1 hover:bg-neutral-800 rounded transition-colors"
                aria-label={showDetails ? "收起详情" : "展开详情"}
              >
                {showDetails ? (
                  <ArrowUp className="h-3 w-3 fill-neutral-400" />
                ) : (
                  <ArrowDown className="h-3 w-3 fill-neutral-400" />
                )}
              </button>
            )}
          </div>

          {/* Collapsible details - full internal analysis */}
          <AnimatePresence>
            {showDetails && hasDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 pt-2 border-t border-neutral-700/50"
              >
                <div className="text-sm text-neutral-400 max-h-96 overflow-y-auto">
                  <MarkdownRenderer includeStandard>
                    {thought.content}
                  </MarkdownRenderer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Displays Team Mode agent thoughts as chat messages in the conversation flow.
 *
 * Design: Matches v0/Cursor style - concise summaries as message bubbles,
 * with expandable details matching OpenHands ExpandableMessage pattern.
 */
export function TeamModeThoughts() {
  const thoughts = useTeamModeStore((state) => state.thoughts);
  const currentAgent = useTeamModeStore((state) => state.currentAgent);
  const isRunning = useTeamModeStore((state) => state.isRunning);

  if (thoughts.length === 0 && !isRunning) {
    return null;
  }

  return (
    <AnimatePresence mode="popLayout">
      {thoughts.map((thought, index) => (
        <ThoughtMessage
          key={`team-thought-${thought.role}-${index}`}
          thought={thought}
          isLatest={index === thoughts.length - 1}
        />
      ))}

      {/* Typing indicator when running */}
      {isRunning && currentAgent && (
        <motion.div
          key="team-typing-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-3 px-4 py-3"
        >
          <div
            className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-lg",
              "bg-gradient-to-br from-neutral-800 to-neutral-900",
              "border border-neutral-700/50",
            )}
          >
            {AGENT_DISPLAY_INFO[currentAgent].icon}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-semibold"
              style={{ color: AGENT_DISPLAY_INFO[currentAgent].color }}
            >
              {AGENT_DISPLAY_INFO[currentAgent].name}
            </span>
            <motion.div
              className="flex gap-1 ml-1"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
