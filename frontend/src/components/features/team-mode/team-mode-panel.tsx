import { useTeamModeStore } from "#/stores/team-mode-store";
import { TeamModeToggle } from "./team-mode-toggle";
import { TeamModeThoughts } from "./team-mode-thoughts";
import { TeamModeAgentIndicator } from "./team-mode-agent-indicator";
import { useTeamModeWebSocket } from "./use-team-mode-websocket";
import { ClarificationPanel, useClarificationStore } from "./clarification";
import { AgentRole } from "#/api/team-mode-service/team-mode-service.types";

// MVP agents (available now)
const MVP_AGENTS: AgentRole[] = ["pm", "architect", "engineer"];

/**
 * Team Mode control panel - displayed in the chat interface
 */
export function TeamModePanel() {
  const { isEnabled, isRunning, currentAgent, error, status, sessionId } =
    useTeamModeStore();
  const { isActive: isClarificationActive } = useClarificationStore();

  // Initialize WebSocket connection when session exists
  const { sendClarificationAnswer } = useTeamModeWebSocket();

  return (
    <div className="space-y-3">
      {/* Toggle always visible */}
      <div className="flex items-center justify-between">
        <TeamModeToggle />

        {/* Show iteration count when running */}
        {isRunning && status && (
          <span className="text-xs text-default-500">
            Iteration {status.iteration}/{status.max_iterations}
          </span>
        )}
      </div>

      {/* Expanded content when enabled */}
      {isEnabled && (
        <div className="space-y-3">
          {/* Agent roster */}
          <div className="rounded-lg border border-default-200 bg-default-50/80 p-3">
            <div className="mb-2 text-xs font-medium text-default-500 uppercase tracking-wide">
              Team Agents
            </div>
            <div className="flex flex-wrap gap-3">
              {MVP_AGENTS.map((role) => (
                <TeamModeAgentIndicator
                  key={role}
                  role={role}
                  isActive={currentAgent === role}
                  size="sm"
                />
              ))}
            </div>
          </div>

          {/* Clarification panel - HITL questions */}
          {isClarificationActive && (
            <ClarificationPanel onSubmit={sendClarificationAnswer} />
          )}

          {/* Thoughts panel - only show when there's an active session and no clarification */}
          {sessionId && !isClarificationActive && <TeamModeThoughts />}

          {/* Error display */}
          {error && (
            <div className="rounded-md border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
