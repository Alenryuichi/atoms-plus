import { useQuery } from "@tanstack/react-query";
import ConversationService from "#/api/conversation-service/conversation-service.api";
import { useConversationId } from "#/hooks/use-conversation-id";
import { useRuntimeIsReady } from "#/hooks/use-runtime-is-ready";

// File extensions that can be previewed
const PREVIEWABLE_EXTENSIONS = [
  ".html",
  ".htm",
  ".css",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".svg",
];

/**
 * Check if a file is previewable based on its extension
 */
export const isPreviewableFile = (filePath: string): boolean => {
  const lowerPath = filePath.toLowerCase();
  return PREVIEWABLE_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
};

/**
 * Recursively fetch all files from a directory
 */
async function fetchFilesRecursively(
  conversationId: string,
  basePath?: string,
  depth: number = 0,
): Promise<string[]> {
  // Limit recursion depth to prevent infinite loops
  if (depth > 5) return [];

  const items = await ConversationService.getFiles(conversationId, basePath);

  // Separate files and directories
  const files: string[] = [];
  const directories: string[] = [];

  for (const item of items) {
    // If item has no extension, it's likely a directory
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(item);
    if (!hasExtension && !item.includes(".")) {
      directories.push(item);
    } else {
      files.push(item);
    }
  }

  // Fetch subdirectories in parallel
  const subFilesArrays = await Promise.all(
    directories.map((dir) =>
      fetchFilesRecursively(conversationId, dir, depth + 1),
    ),
  );

  return [...files, ...subFilesArrays.flat()];
}

/**
 * Hook to fetch workspace files for preview
 * Only returns files that can be previewed (HTML, CSS, JS, etc.)
 * Fetches files recursively from all subdirectories
 */
export const useWorkspaceFiles = (path?: string) => {
  const { conversationId } = useConversationId();
  const runtimeIsReady = useRuntimeIsReady();

  return useQuery({
    queryKey: ["workspace-files", conversationId, path],
    queryFn: async () => {
      const files = await fetchFilesRecursively(conversationId, path);
      // Filter to only include previewable files and sort alphabetically
      return files.filter(isPreviewableFile).sort();
    },
    enabled: runtimeIsReady && !!conversationId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    meta: {
      disableToast: true,
    },
  });
};

/**
 * Hook to fetch all workspace files (not filtered)
 */
export const useAllWorkspaceFiles = (path?: string) => {
  const { conversationId } = useConversationId();
  const runtimeIsReady = useRuntimeIsReady();

  return useQuery({
    queryKey: ["all-workspace-files", conversationId, path],
    queryFn: () => ConversationService.getFiles(conversationId, path),
    enabled: runtimeIsReady && !!conversationId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    meta: {
      disableToast: true,
    },
  });
};
