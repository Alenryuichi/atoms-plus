import { useQuery } from "@tanstack/react-query";
import { SandboxService } from "#/api/sandbox-service/sandbox-service.api";

export const useBatchSandboxes = (ids: string[]) =>
  useQuery({
    queryKey: ["sandboxes", "batch", ids],
    queryFn: () => SandboxService.batchGetSandboxes(ids),
    enabled: ids.length > 0,
    staleTime: 1000 * 10, // keep runtime URLs fresh while conversation is active
    refetchInterval: ids.length > 0 ? 5000 : false,
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
