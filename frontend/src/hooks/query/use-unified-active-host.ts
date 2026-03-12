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
import { OHEvent } from "#/stores/use-event-store";
import { isExecuteBashActionEvent, isV1Event } from "#/types/v1/type-guards";
import {
  extractPortCandidatesFromEvents,
  extractPreviewCandidatesFromEvents,
  ExtractedPortCandidate,
  ExtractedPreviewCandidate,
} from "#/utils/extract-ports-from-events";

type HostSource =
  | "event_preview_url"
  | "primary_preview_url"
  | "dynamic_recent_port"
  | "sandbox_worker_url";

interface HostCandidate {
  host: string;
  source: HostSource;
  lastSeenEventIndex: number;
}

const ensureTrailingSlash = (url: string): string =>
  url.endsWith("/") ? url : `${url}/`;

const getRuntimeBase = (exposedUrl: string): string => {
  const trimmed = exposedUrl.replace(/\/runtime\/\d+\/?$/, "");
  return trimmed;
};

const runtimeHostForPort = (runtimeBase: string, port: number): string =>
  ensureTrailingSlash(`${runtimeBase}/runtime/${port}`);

const toRuntimeHostFromPreview = (
  previewUrl: string,
  runtimeBase: string,
  port: number | null,
): string => {
  if (runtimeBase && port) {
    return runtimeHostForPort(runtimeBase, port);
  }

  try {
    const parsed = new URL(previewUrl);
    const runtimePortMatch = parsed.pathname.match(/\/runtime\/(\d{2,5})\/?$/);
    if (runtimeBase && runtimePortMatch) {
      return runtimeHostForPort(runtimeBase, Number.parseInt(runtimePortMatch[1], 10));
    }
    return ensureTrailingSlash(parsed.origin);
  } catch {
    // Keep raw preview URL fallback.
  }

  return ensureTrailingSlash(previewUrl);
};

const DEV_SERVER_COMMAND_PATTERNS: RegExp[] = [
  /\bnpm\s+run\s+dev\b/i,
  /\bpnpm\s+dev\b/i,
  /\byarn\s+dev\b/i,
  /\bbun\s+run\s+dev\b/i,
  /\bnext\s+dev\b/i,
  /\bvite\b.*\b(dev|preview)\b/i,
];

const findLatestDevServerStartEventIndex = (events: OHEvent[]): number => {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    let command = "";
    if (isV1Event(event) && isExecuteBashActionEvent(event)) {
      command = event.action.command ?? "";
    } else if (
      "action" in event &&
      event.action === "run" &&
      "args" in event &&
      event.args &&
      typeof event.args === "object" &&
      "command" in event.args &&
      typeof event.args.command === "string"
    ) {
      command = event.args.command;
    }

    if (!command) continue;
    if (DEV_SERVER_COMMAND_PATTERNS.some((pattern) => pattern.test(command))) {
      return i;
    }
  }
  return -1;
};

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
  const latestDevServerStartEventIndex = React.useMemo(
    () => findLatestDevServerStartEventIndex(events),
    [events],
  );

  // Extract ports mentioned in conversation (memoized, newest first)
  const dynamicPortCandidates = React.useMemo<ExtractedPortCandidate[]>(
    () =>
      extractPortCandidatesFromEvents(events, 120).filter((candidate) =>
        latestDevServerStartEventIndex >= 0
          ? candidate.lastSeenEventIndex >= latestDevServerStartEventIndex
          : true,
      ),
    [events, latestDevServerStartEventIndex],
  );
  const previewUrlCandidates = React.useMemo<ExtractedPreviewCandidate[]>(
    () =>
      extractPreviewCandidatesFromEvents(events, 160).filter((candidate) =>
        latestDevServerStartEventIndex >= 0
          ? candidate.lastSeenEventIndex >= latestDevServerStartEventIndex
          : true,
      ),
    [events, latestDevServerStartEventIndex],
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
      previewUrlCandidates
        .map((candidate) => `${candidate.previewUrl}:${candidate.lastSeenEventIndex}`)
        .join(","),
      dynamicPortCandidates
        .map((candidate) => `${candidate.port}:${candidate.lastSeenEventIndex}`)
        .join(","),
      latestDevServerStartEventIndex,
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
        const hasFreshDevRun = latestDevServerStartEventIndex >= 0;
        const hasFreshPreviewEvidence = previewUrlCandidates.length > 0;
        const hasFreshDynamicPortEvidence = dynamicPortCandidates.length > 0;

        // Event-bound safety gate: after a new dev run action is observed,
        // never fall back to generic worker probing without fresh evidence.
        if (
          hasFreshDevRun &&
          !hasFreshPreviewEvidence &&
          !hasFreshDynamicPortEvidence
        ) {
          return { hosts: [], forceHost: null };
        }

        const candidates: HostCandidate[] = [];

        // Build a runtime base from worker URLs; avoid relying on exposed_urls[0] ordering.
        const workerExposed =
          sandbox.exposed_urls?.filter((url) => url.name.startsWith("WORKER_")) ?? [];
        const runtimeBaseSource =
          workerExposed.find((url) => /\/runtime\/\d+\/?$/.test(url.url))?.url ||
          workerExposed[0]?.url ||
          "";
        const runtimeBase = runtimeBaseSource
          ? getRuntimeBase(runtimeBaseSource)
          : "";

        previewUrlCandidates.forEach((candidate) => {
          candidates.push({
            host: toRuntimeHostFromPreview(
              candidate.previewUrl,
              runtimeBase,
              candidate.port,
            ),
            source: "event_preview_url",
            lastSeenEventIndex: candidate.lastSeenEventIndex,
          });
        });

        if (sandbox.primary_preview_url) {
          candidates.push({
            host: ensureTrailingSlash(sandbox.primary_preview_url),
            source: "primary_preview_url",
            lastSeenEventIndex: -1,
          });
        }

        // Start with worker URLs from backend
        if (!hasFreshDevRun) {
          for (const exposed of workerExposed) {
            candidates.push({
              host: ensureTrailingSlash(exposed.url),
              source: "sandbox_worker_url",
              lastSeenEventIndex: -1,
            });
          }
        }

        // Add dynamically detected recent ports, ahead of static worker list.
        const existingHosts = new Set(candidates.map((candidate) => candidate.host));
        if (runtimeBase) {
          dynamicPortCandidates.forEach((candidate) => {
            const dynamicUrl = ensureTrailingSlash(
              `${runtimeBase}/runtime/${candidate.port}`,
            );
            if (!existingHosts.has(dynamicUrl)) {
              candidates.push({
                host: dynamicUrl,
                source: "dynamic_recent_port",
                lastSeenEventIndex: candidate.lastSeenEventIndex,
              });
              existingHosts.add(dynamicUrl);
            }
          });
        }

        const sourceRank: Record<HostSource, number> = {
          event_preview_url: 0,
          dynamic_recent_port: 1,
          primary_preview_url: 2,
          sandbox_worker_url: 3,
        };
        candidates.sort((a, b) => {
          if (a.lastSeenEventIndex !== b.lastSeenEventIndex) {
            return b.lastSeenEventIndex - a.lastSeenEventIndex;
          }
          return sourceRank[a.source] - sourceRank[b.source];
        });

        // Remove duplicates while preserving order.
        const dedupedHosts: string[] = [];
        const seen = new Set<string>();
        candidates.forEach((candidate) => {
          if (!seen.has(candidate.host)) {
            dedupedHosts.push(candidate.host);
            seen.add(candidate.host);
          }
        });

        const forceHost =
          candidates.find((candidate) => candidate.source === "event_preview_url")
            ?.host ?? null;

        return { hosts: dedupedHosts, forceHost };
      }

      // V0 (Legacy): Use the legacy API endpoint
      const hosts = await ConversationService.getWebHosts(conversationId);
      return { hosts, forceHost: null };
    },
    enabled:
      runtimeIsReady &&
      !!conversationId &&
      (!isV1Conversation || !!sandboxesQuery.data),
    initialData: { hosts: [], forceHost: null as string | null },
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
          await axios.get(host, { timeout: 2000 });
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
  const lastDevServerStartRef = React.useRef<number>(-1);
  const lastConversationIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!conversationId) return;
    if (lastConversationIdRef.current !== conversationId) {
      setActiveHost("");
      lastConversationIdRef.current = conversationId;
      lastDevServerStartRef.current = -1;
    }
  }, [conversationId]);

  React.useEffect(() => {
    // New dev run command should invalidate sticky host from older execution.
    if (
      latestDevServerStartEventIndex > -1 &&
      latestDevServerStartEventIndex !== lastDevServerStartRef.current
    ) {
      setActiveHost("");
      lastDevServerStartRef.current = latestDevServerStartEventIndex;
    }
  }, [latestDevServerStartEventIndex]);

  React.useEffect(() => {
    const successfulHosts = appsData.filter(
      (host): host is string => typeof host === "string" && host.length > 0,
    );

    if (successfulHosts.length === 0) {
      setActiveHost("");
      return;
    }

    if (data.forceHost && successfulHosts.includes(data.forceHost)) {
      if (activeHost !== data.forceHost) {
        setActiveHost(data.forceHost);
      }
      return;
    }

    // Sticky host: keep current if still healthy to prevent bouncing.
    if (activeHost && successfulHosts.includes(activeHost)) {
      return;
    }

    setActiveHost(successfulHosts[0]);
  }, [appsData, activeHost, data.forceHost]);

  // Calculate overall loading state including dependent queries for V1
  const isLoading = isV1Conversation
    ? isLoadingConfig || sandboxesQuery.isLoading || hostsQueryLoading
    : hostsQueryLoading;

  return { activeHost, isLoading };
};
