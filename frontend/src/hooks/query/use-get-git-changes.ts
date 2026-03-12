import { useQuery } from "@tanstack/react-query";
import React from "react";
import GitService from "#/api/git-service/git-service.api";
import { useConversationId } from "#/hooks/use-conversation-id";
import { GitChange } from "#/api/open-hands.types";
import { useRuntimeIsReady } from "#/hooks/use-runtime-is-ready";

const HIDDEN_PATH_PREFIXES = [".openhands/", ".git/"];

function isUserVisibleChange(change: GitChange): boolean {
  const p = change.path;
  return !HIDDEN_PATH_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(prefix),
  );
}

export const useGetGitChanges = () => {
  const { conversationId } = useConversationId();
  const [orderedChanges, setOrderedChanges] = React.useState<GitChange[]>([]);
  const previousDataRef = React.useRef<GitChange[]>(null);
  const runtimeIsReady = useRuntimeIsReady();

  const result = useQuery({
    queryKey: ["file_changes", conversationId],
    queryFn: () => GitService.getGitChanges(conversationId),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    enabled: runtimeIsReady && !!conversationId,
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
  };
};
