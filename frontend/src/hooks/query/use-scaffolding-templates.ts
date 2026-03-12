import { useQuery } from "@tanstack/react-query";
import ScaffoldingService from "#/api/scaffolding-service/scaffolding-service.api";

export function useScaffoldingTemplates() {
  return useQuery({
    queryKey: ["scaffolding", "templates"],
    queryFn: () => ScaffoldingService.getTemplates(),
    staleTime: 5 * 60 * 1000,
  });
}
