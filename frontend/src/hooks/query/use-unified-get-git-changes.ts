import React from "react";
import { useQuery } from "@tanstack/react-query";
import GitService from "#/api/git-service/git-service.api";
import V1GitService from "#/api/git-service/v1-git-service.api";
import { useConversationId } from "#/hooks/use-conversation-id";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useRuntimeIsReady } from "#/hooks/use-runtime-is-ready";
import { getGitPath } from "#/utils/get-git-path";
import type { GitChange } from "#/api/open-hands.types";

const HIDDEN_PATH_PREFIXES = [".openhands/", ".git/"];

function isUserVisibleChange(change: GitChange): boolean {
  const p = change.path;
  return !HIDDEN_PATH_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(prefix),
  );
}

/**
 * Unified hook to get git changes for both legacy (V0) and V1 conversations
 * - V0: Uses the legacy GitService.getGitChanges API endpoint
 * - V1: Uses the V1GitService.getGitChanges API endpoint with runtime URL
 */
export const useUnifiedGetGitChanges = () => {
  const { conversationId } = useConversationId();
  const { data: conversation } = useActiveConversation();
  const [orderedChanges, setOrderedChanges] = React.useState<GitChange[]>([]);
  const previousDataRef = React.useRef<GitChange[] | null>(null);
  const runtimeIsReady = useRuntimeIsReady();

  const isV1Conversation = conversation?.conversation_version === "V1";
  const conversationUrl = conversation?.url;
  const sessionApiKey = conversation?.session_api_key;
  const selectedRepository = conversation?.selected_repository;

  // Calculate git path based on selected repository
  const gitPath = React.useMemo(
    () => getGitPath(selectedRepository),
    [selectedRepository],
  );

  // V1 conversations require sessionApiKey for authentication
  const hasV1Auth = !isV1Conversation || !!sessionApiKey;

  const result = useQuery({
    queryKey: [
      "file_changes",
      conversationId,
      isV1Conversation,
      conversationUrl,
      sessionApiKey, // Include in queryKey to refetch when auth changes
      gitPath,
    ],
    queryFn: async () => {
      if (!conversationId) throw new Error("No conversation ID");

      // V1: Use the V1 API endpoint with runtime URL
      if (isV1Conversation) {
        return V1GitService.getGitChanges(
          conversationUrl,
          sessionApiKey,
          gitPath,
        );
      }

      // V0 (Legacy): Use the legacy API endpoint
      return GitService.getGitChanges(conversationId);
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    // Wait for sessionApiKey to be available for V1 conversations
    enabled: runtimeIsReady && !!conversationId && hasV1Auth,
    meta: {
      disableToast: true,
    },
  });

  // Latest changes should be on top
  React.useEffect(() => {
    if (!result.isFetching && result.isSuccess && result.data) {
      const currentData = result.data;

      // If this is new data (not the same reference as before)
      if (currentData !== previousDataRef.current) {
        previousDataRef.current = currentData;

        // Figure out new items by comparing with what we already have
        if (Array.isArray(currentData)) {
          const visibleData = currentData.filter(isUserVisibleChange);
          const currentIds = new Set(visibleData.map((item) => item.path));
          const existingIds = new Set(orderedChanges.map((item) => item.path));

          const newItems = visibleData.filter(
            (item) => !existingIds.has(item.path),
          );

          const existingItems = orderedChanges.filter((item) =>
            currentIds.has(item.path),
          );

          setOrderedChanges([...newItems, ...existingItems]);
        } else {
          const single = isUserVisibleChange(currentData)
            ? [currentData]
            : [];
          setOrderedChanges(single);
        }
      }
    }
  }, [result.isFetching, result.isSuccess, result.data]);

  return {
    data: orderedChanges,
    isLoading: result.isLoading,
    isSuccess: result.isSuccess,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
};
