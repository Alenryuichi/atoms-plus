import { useState, useEffect, useMemo, useCallback } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { useTranslation } from "react-i18next";
import { ChevronDown, RefreshCw, FileCode } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { useWorkspaceFiles } from "#/hooks/query/use-workspace-files";
import { useWorkspaceFileContent } from "#/hooks/query/use-workspace-file-content";
import { useRuntimeIsReady } from "#/hooks/use-runtime-is-ready";
import { useConversationId } from "#/hooks/use-conversation-id";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { cn } from "#/utils/utils";

type ViewMode = "split" | "editor" | "preview";

// Storage key prefixes for persisting selected file (conversation-specific)
const STORAGE_KEY_PREFIX_SELECTED_FILE = "preview-selected-file-";
const STORAGE_KEY_PREFIX_VIEW_MODE = "preview-view-mode-";

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

export function PreviewPanel() {
  const { t } = useTranslation();
  const runtimeIsReady = useRuntimeIsReady();
  const { conversationId } = useConversationId();

  // Conversation-specific storage keys
  const storageKeySelectedFile = `${STORAGE_KEY_PREFIX_SELECTED_FILE}${conversationId}`;
  const storageKeyViewMode = `${STORAGE_KEY_PREFIX_VIEW_MODE}${conversationId}`;

  // State
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    if (typeof window !== "undefined" && conversationId) {
      return localStorage.getItem(
        `${STORAGE_KEY_PREFIX_SELECTED_FILE}${conversationId}`,
      );
    }
    return null;
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined" && conversationId) {
      const saved = localStorage.getItem(
        `${STORAGE_KEY_PREFIX_VIEW_MODE}${conversationId}`,
      ) as ViewMode;
      if (saved && ["split", "editor", "preview"].includes(saved)) {
        return saved;
      }
    }
    return "split";
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Click outside handler for dropdown
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const dropdownRef = useClickOutsideElement<HTMLDivElement>(closeDropdown);

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
    isLoading: isLoadingContent,
    error: contentError,
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

  // Persist view mode to localStorage (conversation-specific)
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(storageKeyViewMode, viewMode);
    }
  }, [viewMode, conversationId, storageKeyViewMode]);

  // Build Sandpack files from workspace content
  const sandpackFiles = useMemo(() => {
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

  const template = selectedFile ? getFileTemplate(selectedFile) : "static";

  // Handle file selection
  const handleSelectFile = (file: string) => {
    setSelectedFile(file);
    setIsDropdownOpen(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchFiles();
    if (selectedFile) {
      refetchContent();
    }
  };

  // Render loading state
  if (!runtimeIsReady) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-400">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-sm">
          {t(I18nKey.DIFF_VIEWER$WAITING_FOR_RUNTIME)}
        </p>
      </div>
    );
  }

  // Render error state
  if (filesError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-900 p-4">
        <div className="text-red-400 text-center max-w-md">
          <p className="font-medium mb-2">{t(I18nKey.COMMON$FETCH_ERROR)}</p>
          <p className="text-sm text-neutral-400">
            {filesError instanceof Error
              ? filesError.message
              : "Failed to load workspace files"}
          </p>
          <button
            type="button"
            onClick={() => refetchFiles()}
            className="mt-4 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-white"
          >
            {t(I18nKey.BUTTON$REFRESH)}
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!isLoadingFiles && (!files || files.length === 0)) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-400 p-4">
        <FileCode className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-center">{t(I18nKey.PREVIEW$NO_FILES)}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-neutral-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 border-b border-neutral-700">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* File Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsDropdownOpen(false);
                }
                if (e.key === "ArrowDown" && !isDropdownOpen) {
                  e.preventDefault();
                  setIsDropdownOpen(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded text-sm text-white max-w-[200px]"
              aria-label={t(I18nKey.PREVIEW$SELECT_FILE)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className="truncate">
                {selectedFile
                  ? selectedFile.split("/").pop()
                  : t(I18nKey.PREVIEW$SELECT_FILE)}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 shrink-0 transition-transform",
                  isDropdownOpen && "rotate-180",
                )}
              />
            </button>
            {isDropdownOpen && files && (
              <div
                role="listbox"
                aria-label={t(I18nKey.PREVIEW$SELECT_FILE)}
                className="absolute top-full left-0 mt-1 z-50 min-w-[200px] max-h-[300px] overflow-auto bg-neutral-800 border border-neutral-600 rounded shadow-lg"
              >
                {files.map((file) => {
                  const fileName = file.split("/").pop() || file;
                  const dirPath = file.includes("/")
                    ? file.substring(0, file.lastIndexOf("/"))
                    : "";
                  return (
                    <button
                      key={file}
                      type="button"
                      role="option"
                      aria-selected={selectedFile === file}
                      onClick={() => handleSelectFile(file)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setIsDropdownOpen(false);
                        }
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-neutral-700",
                        selectedFile === file
                          ? "bg-neutral-700 text-white"
                          : "text-neutral-300",
                      )}
                      title={file}
                    >
                      <span className="block truncate">{fileName}</span>
                      {dirPath && (
                        <span className="block text-xs text-neutral-500 truncate">
                          {dirPath}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Loading indicator for content */}
          {isLoadingContent && (
            <div className="flex items-center gap-2 text-neutral-400 text-sm">
              <LoadingSpinner size="small" />
              <span className="hidden sm:inline">Loading...</span>
            </div>
          )}

          {/* Content error */}
          {contentError && (
            <span className="text-red-400 text-sm truncate">
              {t(I18nKey.COMMON$FETCH_ERROR)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex gap-0.5 bg-neutral-800 rounded p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                viewMode === "split"
                  ? "bg-neutral-600 text-white"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              {t(I18nKey.COMMON$SPLIT)}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                viewMode === "editor"
                  ? "bg-neutral-600 text-white"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              {t(I18nKey.COMMON$CODE)}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                viewMode === "preview"
                  ? "bg-neutral-600 text-white"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              {t(I18nKey.COMMON$PREVIEW)}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded"
            aria-label={t(I18nKey.BUTTON$REFRESH)}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sandpack Preview */}
      <div className="flex-1 overflow-hidden">
        {isLoadingFiles ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner size="large" />
          </div>
        ) : (
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
                <SandpackPreview
                  style={{
                    height: "100%",
                    flex: viewMode === "split" ? 1 : "auto",
                  }}
                  showNavigator
                  showRefreshButton
                />
              )}
            </SandpackLayout>
          </SandpackProvider>
        )}
      </div>
    </div>
  );
}
