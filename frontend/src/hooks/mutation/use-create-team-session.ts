import { useMutation, useQueryClient } from "@tanstack/react-query";
import TeamModeService from "#/api/team-mode-service/team-mode-service.api";
import { TeamSessionCreateRequest } from "#/api/team-mode-service/team-mode-service.types";
import { useTeamModeStore } from "#/stores/team-mode-store";

/**
 * Hook to create a new Team Mode session
 */
export function useCreateTeamSession() {
  const queryClient = useQueryClient();
  const { setSessionId, setError, clearThoughts } = useTeamModeStore();

  return useMutation({
    mutationFn: (request: TeamSessionCreateRequest) =>
      TeamModeService.createSession(request),
    onMutate: () => {
      // Clear previous session data
      clearThoughts();
      setError(null);
    },
    onSuccess: (data) => {
      // Store session ID to trigger WebSocket connection
      setSessionId(data.session_id);

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
