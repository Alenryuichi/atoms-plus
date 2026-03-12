import { useQuery } from "@tanstack/react-query";
import ScaffoldingService from "#/api/scaffolding-service/scaffolding-service.api";

export function useScaffoldingUiLibraries() {
  return useQuery({
    queryKey: ["scaffolding", "ui-libraries"],
    queryFn: () => ScaffoldingService.getUiLibraries(),
    staleTime: 5 * 60 * 1000,
  });
}
