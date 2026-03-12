import { DiffEditor, Monaco } from "@monaco-editor/react";
import React from "react";
import { editor as editor_t } from "monaco-editor";
import { IconChevronLeft, IconChevronRight, IconGitCompare } from "@tabler/icons-react";
import { LuFilePlus, LuFileMinus, LuFileDiff, LuFilePen } from "react-icons/lu";
import type { GitChange, GitChangeStatus } from "#/api/open-hands.types";
import { getLanguageFromPath } from "#/utils/get-language-from-path";
import { useUnifiedGitDiff } from "#/hooks/query/use-unified-git-diff";
import { cn } from "#/utils/utils";

const STATUS_LABEL: Record<GitChangeStatus, string> = {
  A: "Added",
  U: "Untracked",
  D: "Deleted",
  M: "Modified",
  R: "Renamed",
};

const STATUS_ICON: Record<GitChangeStatus, React.ComponentType<{ className?: string }>> = {
  A: LuFilePlus,
  U: LuFilePlus,
  D: LuFileMinus,
  M: LuFileDiff,
  R: LuFilePen,
};

const STATUS_COLOR: Record<GitChangeStatus, string> = {
  A: "text-green-400",
  U: "text-green-400",
  D: "text-red-400",
  M: "text-blue-400",
  R: "text-yellow-400",
};

function defineCustomTheme(monaco: Monaco) {
  monaco.editor.defineTheme("atoms-diff-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6a9955" },
      { token: "keyword", foreground: "89b4fa" },
      { token: "string", foreground: "f9e2af" },
      { token: "number", foreground: "a6e3a1" },
      { token: "type", foreground: "cba6f7" },
    ],
    colors: {
      "editor.background": "#0f111500",
      "editorGutter.background": "#0f111500",
      "diffEditor.insertedTextBackground": "#a6e3a125",
      "diffEditor.removedTextBackground": "#f38ba825",
      "diffEditor.insertedLineBackground": "#a6e3a10d",
      "diffEditor.removedLineBackground": "#f38ba80d",
      "diffEditor.border": "#ffffff0f",
      "editorLineNumber.foreground": "#585b70",
      "editor.lineHighlightBackground": "#ffffff05",
      "scrollbar.shadow": "#00000000",
      "editorOverviewRuler.border": "#00000000",
      "editorUnnecessaryCode.border": "#00000000",
      "editorUnnecessaryCode.opacity": "#00000077",
    },
  });
}

interface DiffPanelProps {
  selectedFile: GitChange | null;
  allFiles: GitChange[];
  onNavigate: (path: string) => void;
}

export function DiffPanel({ selectedFile, allFiles, onNavigate }: DiffPanelProps) {
  const diffEditorRef = React.useRef<editor_t.IStandaloneDiffEditor>(null);

  const currentIndex = selectedFile
    ? allFiles.findIndex((f) => f.path === selectedFile.path)
    : -1;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < allFiles.length - 1;

  const filePath = React.useMemo(() => {
    if (!selectedFile) return "";
    if (selectedFile.status === "R") {
      const parts = selectedFile.path.split(/\s+/).slice(1);
      return parts[parts.length - 1];
    }
    return selectedFile.path;
  }, [selectedFile]);

  const isAdded =
    selectedFile?.status === "A" || selectedFile?.status === "U";
  const isDeleted = selectedFile?.status === "D";

  const {
    data: diff,
    isLoading,
    isSuccess,
  } = useUnifiedGitDiff({
    filePath,
    type: selectedFile?.status ?? "M",
    enabled: !!selectedFile,
  });

  const handleEditorDidMount = React.useCallback(
    (editor: editor_t.IStandaloneDiffEditor) => {
      diffEditorRef.current = editor;
    },
    [],
  );

  if (!selectedFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-3">
        <IconGitCompare className="w-10 h-10 text-neutral-600" stroke={1.5} />
        <span className="text-sm">Select a file to view changes</span>
      </div>
    );
  }

  const StatusIcon = STATUS_ICON[selectedFile.status] ?? LuFileDiff;
  const statusColor = STATUS_COLOR[selectedFile.status] ?? "text-neutral-400";
  const statusLabel = STATUS_LABEL[selectedFile.status] ?? "Unknown";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0">
        <StatusIcon className={cn("w-4 h-4 shrink-0", statusColor)} />
        <span className="text-xs text-neutral-300 truncate flex-1" title={filePath}>
          {filePath}
        </span>
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded", statusColor, "bg-white/[0.03]")}>
          {statusLabel}
        </span>

        {/* Navigation */}
        <div className="flex items-center gap-0.5 ml-1">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => canGoPrev && onNavigate(allFiles[currentIndex - 1].path)}
            className="p-0.5 text-neutral-500 hover:text-neutral-300 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <IconChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-neutral-600 min-w-[3ch] text-center">
            {currentIndex + 1}/{allFiles.length}
          </span>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => canGoNext && onNavigate(allFiles[currentIndex + 1].path)}
            className="p-0.5 text-neutral-500 hover:text-neutral-300 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <IconChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full w-5 h-5 border-2 border-white/20 border-t-white/70" />
          </div>
        )}
        {isSuccess && diff && (
          <DiffEditor
            className="w-full h-full"
            language={getLanguageFromPath(filePath)}
            original={isAdded ? "" : diff.original}
            modified={isDeleted ? "" : diff.modified}
            theme="atoms-diff-theme"
            onMount={handleEditorDidMount}
            beforeMount={defineCustomTheme}
            options={{
              renderValidationDecorations: "off",
              readOnly: true,
              renderSideBySide: !isAdded && !isDeleted,
              scrollBeyondLastLine: false,
              minimap: { enabled: false },
              hideUnchangedRegions: { enabled: true },
              automaticLayout: true,
              scrollbar: {
                alwaysConsumeMouseWheel: false,
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
              padding: { top: 8 },
            }}
          />
        )}
      </div>
    </div>
  );
}
