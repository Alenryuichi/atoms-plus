import { motion, AnimatePresence } from "framer-motion";
import { useTeamModeStore } from "#/stores/team-mode-store";
import { TeamModeAgentIndicator } from "./team-mode-agent-indicator";
import { AGENT_DISPLAY_INFO } from "#/api/team-mode-service/team-mode-service.types";
import { cn } from "#/utils/utils";

/**
 * Displays streaming thoughts from agents during Team Mode collaboration
 */
export function TeamModeThoughts() {
  const { thoughts, currentAgent, isRunning } = useTeamModeStore();

  if (thoughts.length === 0 && !isRunning) {
    return null;
  }

  return (
    <div className="rounded-lg border border-default-200 bg-default-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-default-700">
          🧠 Agent Thoughts
        </span>
        {currentAgent && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-default-500">Active:</span>
            <TeamModeAgentIndicator role={currentAgent} isActive size="sm" />
          </div>
        )}
      </div>

      <div className="max-h-60 space-y-2 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {thoughts.map((thought, index) => {
            const info = AGENT_DISPLAY_INFO[thought.role];
            const isThinking = thought.status === "thinking";

            return (
              <motion.div
                key={`${thought.role}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "rounded-md border p-3",
                  isThinking
                    ? "border-primary-200 bg-primary-50"
                    : "border-default-200 bg-white",
                )}
              >
                {/* Agent header */}
                <div className="mb-1.5 flex items-center gap-2">
                  <span>{info.icon}</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: info.color }}
                  >
                    {info.name}
                  </span>
                  {isThinking && (
                    <motion.span
                      className="text-xs text-primary-500"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      thinking...
                    </motion.span>
                  )}
                </div>

                {/* Thought content */}
                <p className="text-sm text-default-700 whitespace-pre-wrap">
                  {thought.content}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator when running but no recent thought */}
        {isRunning && currentAgent && thoughts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 py-2"
          >
            <span>{AGENT_DISPLAY_INFO[currentAgent].icon}</span>
            <motion.div
              className="flex gap-1"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <span className="h-2 w-2 rounded-full bg-primary-400" />
              <span className="h-2 w-2 rounded-full bg-primary-400" />
              <span className="h-2 w-2 rounded-full bg-primary-400" />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
