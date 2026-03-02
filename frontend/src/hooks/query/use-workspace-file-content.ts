import { useQuery } from "@tanstack/react-query";
import ConversationService from "#/api/conversation-service/conversation-service.api";
import { useConversationId } from "#/hooks/use-conversation-id";
import { useRuntimeIsReady } from "#/hooks/use-runtime-is-ready";

/**
 * Hook to fetch the content of a specific workspace file
 * @param filePath Path to the file to read
 */
export const useWorkspaceFileContent = (filePath: string | null) => {
  const { conversationId } = useConversationId();
  const runtimeIsReady = useRuntimeIsReady();

  return useQuery({
    queryKey: ["workspace-file-content", conversationId, filePath],
    queryFn: async () => {
      if (!filePath) throw new Error("No file path provided");
      const response = await ConversationService.selectFile(
        conversationId,
        filePath,
      );
      return response.code;
    },
    enabled: runtimeIsReady && !!conversationId && !!filePath,
    staleTime: 1000 * 10, // 10 seconds - files change frequently during development
    gcTime: 1000 * 60 * 5, // 5 minutes
    meta: {
      disableToast: true,
    },
  });
};
