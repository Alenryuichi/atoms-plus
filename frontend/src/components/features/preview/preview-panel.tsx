import {
  useState,
  useEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
} from "@codesandbox/sandpack-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { IconFileCode } from "@tabler/icons-react";
import { I18nKey } from "#/i18n/declaration";
import { useWorkspaceFiles } from "#/hooks/query/use-workspace-files";
import { useWorkspaceFileContent } from "#/hooks/query/use-workspace-file-content";
import { useRuntimeIsReady } from "#/hooks/use-runtime-is-ready";
import { useConversationId } from "#/hooks/use-conversation-id";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { useConversationStore } from "#/stores/conversation-store";
import { MOCK_FILE_CONTENTS } from "#/mocks/preview-handlers";

// Check if running in mock mode
const isMockMode = import.meta.env.VITE_MOCK_API === "true";

// Animation variants for view mode transitions
const contentVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.15,
    },
  },
};

// Storage key prefix for persisting selected file (conversation-specific)
const STORAGE_KEY_PREFIX_SELECTED_FILE = "preview-selected-file-";

// Export handle type for ref
export interface PreviewPanelHandle {
  refresh: () => void;
}

/**
 * Get file extension and determine Sandpack template
 */
function getFileTemplate(
  filePath: string,
): "static" | "react" | "react-ts" | "vanilla" | "vanilla-ts" {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "tsx":
      return "react-ts";
    case "jsx":
      return "react";
    case "ts":
      return "vanilla-ts";
    case "js":
      return "vanilla";
    case "html":
    case "htm":
    case "css":
    case "json":
    case "svg":
    default:
      return "static";
  }
}

/**
 * Get the filename from path for Sandpack
 */
function getSandpackFileName(filePath: string): string {
  const fileName = filePath.split("/").pop() || "index.html";
  return `/${fileName}`;
}

function PreviewPanelComponent(
  _props: object,
  ref: React.Ref<PreviewPanelHandle>,
) {
  const { t } = useTranslation();
  const runtimeIsReady = useRuntimeIsReady();
  const { conversationId } = useConversationId();
  const { previewViewMode: viewMode, previewSubTab } = useConversationStore();

  // Conversation-specific storage key for selected file
  const storageKeySelectedFile = `${STORAGE_KEY_PREFIX_SELECTED_FILE}${conversationId}`;

  // State - only selected file is local state now
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    if (typeof window !== "undefined" && conversationId) {
      return localStorage.getItem(
        `${STORAGE_KEY_PREFIX_SELECTED_FILE}${conversationId}`,
      );
    }
    return null;
  });

  // Fetch workspace files
  const {
    data: files,
    isLoading: isLoadingFiles,
    error: filesError,
    refetch: refetchFiles,
  } = useWorkspaceFiles();

  // Fetch selected file content
  const {
    data: fileContent,
    // isLoading and error are handled by Sandpack internally
    refetch: refetchContent,
  } = useWorkspaceFileContent(selectedFile);

  // Auto-select first file if none selected
  useEffect(() => {
    if (files && files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    }
  }, [files, selectedFile]);

  // Persist selected file to localStorage (conversation-specific)
  useEffect(() => {
    if (selectedFile && conversationId) {
      localStorage.setItem(storageKeySelectedFile, selectedFile);
    }
  }, [selectedFile, conversationId, storageKeySelectedFile]);

  // Build Sandpack files from workspace content
  const sandpackFiles = useMemo(() => {
    // In mock mode, use all mock files for complete React project support
    if (isMockMode) {
      const mockFiles: Record<string, { code: string }> = {};
      Object.entries(MOCK_FILE_CONTENTS).forEach(([path, code]) => {
        // Convert file path to Sandpack format (e.g., "src/App.tsx" -> "/src/App.tsx")
        const sandpackPath = path.startsWith("/") ? path : `/${path}`;
        mockFiles[sandpackPath] = { code };
      });
      return mockFiles;
    }

    // Normal mode: use single file content
    if (!fileContent || !selectedFile) {
      return {
        "/index.html": {
          code: `<!DOCTYPE html>
<html><head><title>Preview</title></head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a1a;color:#888;font-family:sans-serif;">
<p>Select a file to preview</p>
</body></html>`,
        },
      };
    }
    const fileName = getSandpackFileName(selectedFile);
    return { [fileName]: { code: fileContent } };
  }, [fileContent, selectedFile]);

  // In mock mode, always use react-ts template for full React project support
  const getTemplate = ():
    | "react-ts"
    | "static"
    | ReturnType<typeof getFileTemplate> => {
    if (isMockMode) return "react-ts";
    if (selectedFile) return getFileTemplate(selectedFile);
    return "static";
  };
  const template = getTemplate();

  // Handle refresh - exposed via ref for parent component
  const handleRefresh = () => {
    refetchFiles();
    if (selectedFile) {
      refetchContent();
    }
  };

  // Expose refresh method to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: handleRefresh,
  }));

  // Render loading state - Atoms Plus: Transparent background
  if (!runtimeIsReady) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-transparent text-neutral-400">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-sm text-neutral-500">
          {t(I18nKey.DIFF_VIEWER$WAITING_FOR_RUNTIME)}
        </p>
      </div>
    );
  }

  // Render error state - Atoms Plus: Transparent background
  if (filesError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-transparent p-4">
        <div className="text-red-400 text-center max-w-md">
          <p className="font-medium mb-2">{t(I18nKey.COMMON$FETCH_ERROR)}</p>
          <p className="text-sm text-neutral-500">
            {filesError instanceof Error
              ? filesError.message
              : "Failed to load workspace files"}
          </p>
          <button
            type="button"
            onClick={() => refetchFiles()}
            className="mt-4 px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-amber-500/30 rounded-lg text-sm text-white transition-all"
          >
            {t(I18nKey.BUTTON$REFRESH)}
          </button>
        </div>
      </div>
    );
  }

  // Render empty state - Atoms Plus: Transparent background
  if (!isLoadingFiles && (!files || files.length === 0)) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-transparent text-neutral-500 p-4">
        <IconFileCode
          size={48}
          stroke={1.5}
          className="mb-4 opacity-40 text-amber-500/50"
        />
        <p className="text-center">{t(I18nKey.PREVIEW$NO_FILES)}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-transparent relative">
      {/* Sandpack Preview - clean content area without toolbar */}
      <div className="flex-1 overflow-hidden h-full">
        <AnimatePresence mode="wait">
          {isLoadingFiles ? (
            <motion.div
              key="loading"
              className="h-full flex items-center justify-center"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <LoadingSpinner size="large" />
            </motion.div>
          ) : (
            <motion.div
              key={`${selectedFile}-${viewMode}-${previewSubTab}`}
              className="h-full flex flex-col"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <SandpackProvider
                key={`${selectedFile}-${template}`}
                template={template}
                files={sandpackFiles}
                theme="dark"
                options={{
                  recompileMode: "delayed",
                  recompileDelay: 300,
                }}
              >
                <SandpackLayout
                  style={{
                    height: "100%",
                    border: "none",
                    borderRadius: 0,
                    flex: 1,
                  }}
                >
                  {(viewMode === "split" || viewMode === "editor") && (
                    <SandpackCodeEditor
                      style={{
                        height: "100%",
                        flex: viewMode === "split" ? 1 : "auto",
                      }}
                      showTabs
                      showLineNumbers
                      showInlineErrors
                      wrapContent
                    />
                  )}
                  {(viewMode === "split" || viewMode === "preview") && (
                    <div className="flex-1 w-full h-full relative flex flex-col">
                      {previewSubTab === "design" ? (
                        <SandpackPreview
                          style={{
                            height: "100%",
                            width: "100%",
                            flex: 1,
                          }}
                          showNavigator={false}
                          showRefreshButton={false}
                        />
                      ) : (
                        <div className="flex-1 w-full h-full bg-[#151515] overflow-auto flex flex-col">
                          {/* We render SandpackPreview hidden to keep the application running,
                                while displaying the console on top */}
                          <div className="hidden">
                            <SandpackPreview
                              showNavigator={false}
                              showRefreshButton={false}
                            />
                          </div>
                          <SandpackConsole
                            standalone
                            resetOnPreviewRestart
                            style={{ flex: 1, height: "100%" }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </SandpackLayout>
              </SandpackProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const PreviewPanel = forwardRef<PreviewPanelHandle>(
  PreviewPanelComponent,
);
PreviewPanel.displayName = "PreviewPanel";
