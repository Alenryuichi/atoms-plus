import { useQueries, useQuery } from "@tanstack/react-query";
import axios from "axios";
import React from "react";
import ConversationService from "#/api/conversation-service/conversation-service.api";
import { useConversationId } from "#/hooks/use-conversation-id";
import { useRuntimeIsReady } from "#/hooks/use-runtime-is-ready";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useBatchSandboxes } from "./use-batch-sandboxes";
import { useConversationConfig } from "./use-conversation-config";
import { useEventStore } from "#/stores/use-event-store";
import { extractPortsFromEvents } from "#/utils/extract-ports-from-events";

/**
 * Unified hook to get active web host for both legacy (V0) and V1 conversations
 * - V0: Uses the legacy getWebHosts API endpoint and polls them
 * - V1: Gets worker URLs from sandbox exposed_urls (WORKER_1, WORKER_2, etc.)
 *       + dynamically detected ports from conversation messages
 */
export const useUnifiedActiveHost = () => {
  const [activeHost, setActiveHost] = React.useState<string | null>(null);
  const { conversationId } = useConversationId();
  const runtimeIsReady = useRuntimeIsReady();
  const { data: conversation } = useActiveConversation();
  const { data: conversationConfig, isLoading: isLoadingConfig } =
    useConversationConfig();

  const isV1Conversation = conversation?.conversation_version === "V1";
  const sandboxId = conversationConfig?.runtime_id;

  // Get events from store for dynamic port detection
  const events = useEventStore((state) => state.events);

  // Extract ports mentioned in conversation (memoized)
  const dynamicPorts = React.useMemo(
    () => extractPortsFromEvents(events, 50),
    [events],
  );

  // Fetch sandbox data for V1 conversations
  const sandboxesQuery = useBatchSandboxes(sandboxId ? [sandboxId] : []);

  // Get worker URLs from V1 sandbox or legacy web hosts from V0
  const { data, isLoading: hostsQueryLoading } = useQuery({
    queryKey: [
      conversationId,
      "unified",
      "hosts",
      isV1Conversation,
      sandboxId,
      dynamicPorts.join(","),
    ],
    queryFn: async () => {
      // V1: Get worker URLs from sandbox exposed_urls + dynamic ports
      if (isV1Conversation) {
        if (
          !sandboxesQuery.data ||
          sandboxesQuery.data.length === 0 ||
          !sandboxesQuery.data[0]
        ) {
          return { hosts: [] };
        }

        const sandbox = sandboxesQuery.data[0];

        // Get backend URL base from any exposed URL
        const anyUrl = sandbox.exposed_urls?.[0]?.url || "";
        const urlBase = anyUrl.replace(/\/runtime\/\d+\/?$/, "");

        // Start with worker URLs from backend
        const workerUrls =
          sandbox.exposed_urls
            ?.filter((url) => url.name.startsWith("WORKER_"))
            .map((url) => {
              const baseUrl = url.url;
              return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
            }) || [];

        // Add dynamically detected ports (not already in worker URLs)
        const existingPorts = new Set(
          workerUrls.map((url) => {
            const match = url.match(/\/runtime\/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          }),
        );

        const dynamicUrls = dynamicPorts
          .filter((port) => !existingPorts.has(port))
          .map((port) => `${urlBase}/runtime/${port}/`);

        // Dynamic ports first (more likely to be correct), then fallback to backend list
        return { hosts: [...dynamicUrls, ...workerUrls] };
      }

      // V0 (Legacy): Use the legacy API endpoint
      const hosts = await ConversationService.getWebHosts(conversationId);
      return { hosts };
    },
    enabled:
      runtimeIsReady &&
      !!conversationId &&
      (!isV1Conversation || !!sandboxesQuery.data),
    initialData: { hosts: [] },
    meta: {
      disableToast: true,
    },
  });

  // Poll all hosts to find which one is active
  const apps = useQueries({
    queries: data.hosts.map((host) => ({
      queryKey: [conversationId, "unified", "hosts", host],
      queryFn: async () => {
        try {
          await axios.get(host);
          return host;
        } catch (e) {
          return "";
        }
      },
      refetchInterval: 3000,
      meta: {
        disableToast: true,
      },
    })),
  });

  const appsData = apps.map((app) => app.data);

  React.useEffect(() => {
    const successfulApp = appsData.find((app) => app);
    setActiveHost(successfulApp || "");
  }, [appsData]);

  // Calculate overall loading state including dependent queries for V1
  const isLoading = isV1Conversation
    ? isLoadingConfig || sandboxesQuery.isLoading || hostsQueryLoading
    : hostsQueryLoading;

  return { activeHost, isLoading };
};
