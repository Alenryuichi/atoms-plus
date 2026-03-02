import { useMutation } from "@tanstack/react-query";
import RaceModeService from "#/api/race-mode-service/race-mode-service.api";
import { RaceStartRequest } from "#/api/race-mode-service/race-mode-service.types";

/**
 * Hook to start a race
 */
export function useRaceStart() {
  return useMutation({
    mutationFn: (request: RaceStartRequest) =>
      RaceModeService.startRace(request),
  });
}
