import { useMutation } from "@tanstack/react-query";
import ScaffoldingService from "#/api/scaffolding-service/scaffolding-service.api";
import { ScaffoldingConfig } from "#/components/features/scaffolding/types";

export function useLaunchScaffold() {
  return useMutation({
    mutationFn: (config: ScaffoldingConfig) =>
      ScaffoldingService.launchProject(config),
  });
}
