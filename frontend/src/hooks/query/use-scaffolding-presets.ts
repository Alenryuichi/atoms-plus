import { useQuery } from "@tanstack/react-query";
import ScaffoldingService from "#/api/scaffolding-service/scaffolding-service.api";

export function useScaffoldingPresets() {
  return useQuery({
    queryKey: ["scaffolding", "presets"],
    queryFn: () => ScaffoldingService.getPresets(),
    staleTime: 5 * 60 * 1000,
  });
}
