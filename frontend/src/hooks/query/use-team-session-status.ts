import { useQuery } from "@tanstack/react-query";
import TeamModeService from "#/api/team-mode-service/team-mode-service.api";

/**
 * Hook to fetch Team Mode session status
 */
export function useTeamSessionStatus(sessionId: string | null) {
  return useQuery({
    queryKey: ["team-session-status", sessionId],
    queryFn: () =>
      sessionId ? TeamModeService.getSessionStatus(sessionId) : null,
    enabled: !!sessionId,
    refetchInterval: (query) => {
      // Poll every 2 seconds while session is running
      const { data } = query.state;
      if (data && data.status === "running") {
        return 2000;
      }
      return false;
    },
  });
}
