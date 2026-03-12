import { useQuery } from "@tanstack/react-query";
import ScaffoldingService from "#/api/scaffolding-service/scaffolding-service.api";

export function useScaffoldingFeatures() {
  return useQuery({
    queryKey: ["scaffolding", "features"],
    queryFn: () => ScaffoldingService.getFeatures(),
    staleTime: 5 * 60 * 1000,
  });
}
