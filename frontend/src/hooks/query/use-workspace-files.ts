import { useQuery } from "@tanstack/react-query";
import ConversationService from "#/api/conversation-service/conversation-service.api";
import { useConversationId } from "#/hooks/use-conversation-id";
import { useRuntimeIsReady } from "#/hooks/use-runtime-is-ready";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";

// Web-related file extensions that can be previewed (excludes .json which are usually system files)
const WEB_PREVIEWABLE_EXTENSIONS = [
  ".html",
  ".htm",
  ".css",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".svg",
];

// System directories that should be excluded from preview
const EXCLUDED_DIRECTORIES = [
  "conversations/",
  "bash_events/",
  ".git/",
  "node_modules/",
  "__pycache__/",
  ".openhands/",
];

// Entry file priority - files at the top are selected first as the main entry point
const ENTRY_FILE_PRIORITY = [
  "index.html",
  "index.htm",
  "app.tsx",
  "app.jsx",
  "main.tsx",
  "main.jsx",
  "app.ts",
  "app.js",
  "main.ts",
  "main.js",
];

/**
 * Check if a file path is in an excluded system directory
 */
const isInExcludedDirectory = (filePath: string): boolean => {
  const lowerPath = filePath.toLowerCase();
  return EXCLUDED_DIRECTORIES.some((dir) => lowerPath.includes(dir));
};

/**
 * Check if a file is previewable based on its extension (web files only)
 */
export const isPreviewableFile = (filePath: string): boolean => {
  const lowerPath = filePath.toLowerCase();
  // Exclude system directories
  if (isInExcludedDirectory(lowerPath)) {
    return false;
  }
  return WEB_PREVIEWABLE_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
};

/**
 * Sort files with entry files first, then alphabetically
 * Returns a new sorted array
 */
export const sortFilesWithEntryPriority = (files: string[]): string[] =>
  [...files].sort((a, b) => {
    const aFileName = a.split("/").pop()?.toLowerCase() || "";
    const bFileName = b.split("/").pop()?.toLowerCase() || "";

    const aIndex = ENTRY_FILE_PRIORITY.findIndex(
      (entry) => aFileName === entry.toLowerCase(),
    );
    const bIndex = ENTRY_FILE_PRIORITY.findIndex(
      (entry) => bFileName === entry.toLowerCase(),
    );

    // If both are entry files, sort by priority
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // Entry files come first
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // Root-level files come before nested files
    const aDepth = a.split("/").length;
    const bDepth = b.split("/").length;
    if (aDepth !== bDepth) {
      return aDepth - bDepth;
    }

    // Otherwise sort alphabetically
    return a.localeCompare(b);
  });

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
// Check if running in mock mode
const isMockMode = import.meta.env.VITE_MOCK_API === "true";

export const useWorkspaceFiles = (path?: string) => {
  const { conversationId } = useConversationId();
  const runtimeIsReady = useRuntimeIsReady();

  // Use the reactive conversation data to ensure we have URL and session_api_key
  // This ensures V1 conversations use the correct runtime proxy URL
  const { data: conversation, isFetched: isConversationFetched } =
    useActiveConversation();

  // For V1 conversations, we need the URL to be set before making file requests
  // This ensures the runtime proxy URL and session API key are available
  const isConversationReady =
    isConversationFetched &&
    conversation?.conversation_id === conversationId &&
    // V1 conversations have a URL, V0 don't - both should work
    (conversation?.url !== undefined ||
      conversation?.conversation_version === "V0");

  const isEnabled = runtimeIsReady && !!conversationId && isConversationReady;

  return useQuery({
    queryKey: ["workspace-files", conversationId, path],
    queryFn: async () => {
      if (isMockMode) {
        console.log(
          "%c[useWorkspaceFiles] Fetching files...",
          "background: #22c55e; color: #fff; padding: 2px 6px; border-radius: 4px;",
        );
      }
      const files = await fetchFilesRecursively(conversationId, path);
      if (isMockMode) {
        console.log(
          "%c[useWorkspaceFiles] Files fetched:",
          "background: #22c55e; color: #fff; padding: 2px 6px; border-radius: 4px;",
          files,
        );
      }
      // Filter to only include previewable web files and sort with entry files first
      const previewableFiles = files.filter(isPreviewableFile);
      return sortFilesWithEntryPriority(previewableFiles);
    },
    enabled: isEnabled,
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

  // Use the reactive conversation data to ensure we have URL and session_api_key
  const { data: conversation, isFetched: isConversationFetched } =
    useActiveConversation();

  const isConversationReady =
    isConversationFetched &&
    conversation?.conversation_id === conversationId &&
    (conversation?.url !== undefined ||
      conversation?.conversation_version === "V0");

  return useQuery({
    queryKey: ["all-workspace-files", conversationId, path],
    queryFn: () => ConversationService.getFiles(conversationId, path),
    enabled: runtimeIsReady && !!conversationId && isConversationReady,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    meta: {
      disableToast: true,
    },
  });
};
