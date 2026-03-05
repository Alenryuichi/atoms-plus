import { RUNTIME_INACTIVE_STATES } from "#/types/agent-state";
import { useActiveConversation } from "./query/use-active-conversation";
import { useAgentState } from "#/hooks/use-agent-state";

// Check if running in mock mode
const isMockMode = import.meta.env.VITE_MOCK_API === "true";

/**
 * Hook to determine if the runtime is ready for operations
 *
 * @returns boolean indicating if the runtime is ready
 */
export const useRuntimeIsReady = (): boolean => {
  const { data: conversation, isLoading, isFetched } = useActiveConversation();
  const { curAgentState } = useAgentState();

  // Debug logging for mock mode
  if (isMockMode) {
    console.log(
      "%c[useRuntimeIsReady]",
      "background: #d4a855; color: #000; padding: 2px 6px; border-radius: 4px;",
      {
        isMockMode,
        conversation: conversation
          ? { id: conversation.conversation_id, status: conversation.status }
          : null,
        curAgentState,
        isLoading,
        isFetched,
      },
    );
  }

  // In mock mode, always return true when conversation exists
  // This allows testing Preview panel without a real runtime
  if (isMockMode && conversation) {
    console.log(
      "%c[useRuntimeIsReady] MOCK MODE - returning TRUE",
      "background: #22c55e; color: #fff; padding: 2px 6px; border-radius: 4px;",
    );
    return true;
  }

  return (
    conversation?.status === "RUNNING" &&
    !RUNTIME_INACTIVE_STATES.includes(curAgentState)
  );
};
