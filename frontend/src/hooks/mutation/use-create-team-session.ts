import { useMutation, useQueryClient } from "@tanstack/react-query";
import TeamModeService from "#/api/team-mode-service/team-mode-service.api";
import { TeamSessionCreateRequest } from "#/api/team-mode-service/team-mode-service.types";
import { useTeamModeStore } from "#/stores/team-mode-store";

/**
 * Parameters for creating a Team Mode session
 */
export interface CreateTeamSessionParams {
  /** The task/message to process */
  task: string;
  /** Optional model override */
  model?: string;
  /** Maximum iterations for the planning loop */
  maxIterations?: number;
  /** OpenHands conversation ID - enables code execution via CodeActAgent handoff */
  conversationId?: string;
}

/**
 * Hook to create a new Team Mode session
 *
 * When `conversationId` is provided, the session will be bound to the existing
 * OpenHands conversation, enabling the Handoff mechanism to execute code.
 */
export function useCreateTeamSession() {
  const queryClient = useQueryClient();
  // Use individual selectors to prevent re-renders when unrelated state changes
  const setSessionId = useTeamModeStore((state) => state.setSessionId);
  const setError = useTeamModeStore((state) => state.setError);
  const clearThoughts = useTeamModeStore((state) => state.clearThoughts);

  return useMutation({
    mutationFn: (params: CreateTeamSessionParams) => {
      const request: TeamSessionCreateRequest = {
        task: params.task,
        model: params.model,
        max_iterations: params.maxIterations,
        conversation_id: params.conversationId,
      };
      return TeamModeService.createSession(request);
    },
    onMutate: () => {
      // Clear previous session data
      clearThoughts();
      setError(null);
    },
    onSuccess: (data) => {
      // Store session ID to trigger WebSocket connection
      setSessionId(data.session_id);

      // Show warning if conversation binding failed but session was still created
      if (data.binding_warning) {
        setError(`Code execution disabled: ${data.binding_warning}`);
      }

      // Invalidate session status queries
      queryClient.invalidateQueries({
        queryKey: ["team-session-status"],
      });
    },
    onError: (error: Error) => {
      setError(error.message || "Failed to create Team Mode session");
    },
  });
}
