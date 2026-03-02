import { useQuery } from "@tanstack/react-query";
import RaceModeService from "#/api/race-mode-service/race-mode-service.api";

/**
 * Hook to fetch available Race Mode models
 */
export function useRaceModels() {
  return useQuery({
    queryKey: ["race-models"],
    queryFn: () => RaceModeService.getModels(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
