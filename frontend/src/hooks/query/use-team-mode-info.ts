import { useQuery } from "@tanstack/react-query";
import TeamModeService from "#/api/team-mode-service/team-mode-service.api";

/**
 * Hook to fetch Team Mode information
 */
export function useTeamModeInfo() {
  return useQuery({
    queryKey: ["team-mode-info"],
    queryFn: () => TeamModeService.getInfo(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
