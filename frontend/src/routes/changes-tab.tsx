import { useTranslation } from "react-i18next";
import React from "react";
import { EmptyChangesMessage } from "#/components/features/diff-viewer/empty-changes-message";
import { FileTree } from "#/components/features/diff-viewer/file-tree";
import { DiffPanel } from "#/components/features/diff-viewer/diff-panel";
import { ChangesToolbar } from "#/components/features/diff-viewer/changes-toolbar";
import { retrieveAxiosErrorMessage } from "#/utils/retrieve-axios-error-message";
import { useUnifiedGetGitChanges } from "#/hooks/query/use-unified-get-git-changes";
import { useFileTree } from "#/hooks/use-file-tree";
import { I18nKey } from "#/i18n/declaration";
import { RUNTIME_INACTIVE_STATES } from "#/types/agent-state";
import { RandomTip } from "#/components/features/tips/random-tip";
import { useAgentState } from "#/hooks/use-agent-state";
import type { GitChange } from "#/api/open-hands.types";

const GIT_REPO_ERROR_PATTERN = /not a git repository/i;
const DIRECTORY_NOT_EXIST_PATTERN = /directory does not exist/i;

function StatusMessage({ children }: React.PropsWithChildren) {
  return (
    <div className="w-full h-full flex flex-col items-center text-center justify-center text-2xl text-tertiary-light">
      {children}
    </div>
  );
}

function GitChanges() {
  const { t } = useTranslation();
  const {
    data: gitChanges,
    isSuccess,
    isError,
    error,
    isLoading: loadingGitChanges,
  } = useUnifiedGetGitChanges();

  const [statusMessage, setStatusMessage] = React.useState<string[] | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);

  const { curAgentState } = useAgentState();
  const runtimeIsActive = !RUNTIME_INACTIVE_STATES.includes(curAgentState);

  const isNotGitRepoError =
    error && GIT_REPO_ERROR_PATTERN.test(retrieveAxiosErrorMessage(error));
  const isDirectoryNotExistError =
    error && DIRECTORY_NOT_EXIST_PATTERN.test(retrieveAxiosErrorMessage(error));

  React.useEffect(() => {
    if (!runtimeIsActive) {
      setStatusMessage([I18nKey.DIFF_VIEWER$WAITING_FOR_RUNTIME]);
    } else if (error) {
      const errorMessage = retrieveAxiosErrorMessage(error);
      if (
        GIT_REPO_ERROR_PATTERN.test(errorMessage) ||
        DIRECTORY_NOT_EXIST_PATTERN.test(errorMessage)
      ) {
        setStatusMessage([
          I18nKey.DIFF_VIEWER$NOT_A_GIT_REPO,
          I18nKey.DIFF_VIEWER$ASK_OH,
        ]);
      } else {
        setStatusMessage([errorMessage]);
      }
    } else if (loadingGitChanges) {
      setStatusMessage([I18nKey.DIFF_VIEWER$LOADING]);
    } else {
      setStatusMessage(null);
    }
  }, [
    runtimeIsActive,
    isNotGitRepoError,
    isDirectoryNotExistError,
    loadingGitChanges,
    error,
    setStatusMessage,
  ]);

  const {
    flatNodes,
    expandedPaths,
    toggleExpanded,
    expandAll,
    collapseAll,
    showArtifacts,
    setShowArtifacts,
    artifactCount,
    stats,
  } = useFileTree(gitChanges ?? [], searchQuery);

  const selectedFile: GitChange | null = React.useMemo(() => {
    if (!selectedPath || !gitChanges) return null;
    return gitChanges.find((c) => c.path === selectedPath) ?? null;
  }, [selectedPath, gitChanges]);

  const allVisibleFiles = React.useMemo(() => {
    if (!gitChanges) return [];
    return gitChanges.filter((c) => {
      if (searchQuery.trim()) {
        return c.path.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [gitChanges, searchQuery]);

  const handleSelectFile = React.useCallback((path: string) => {
    setSelectedPath(path);
  }, []);

  const hasChanges = isSuccess && gitChanges && gitChanges.length > 0;

  if (!hasChanges) {
    return (
      <main className="h-full flex flex-col">
        <div className="relative flex h-full w-full items-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            {statusMessage && (
              <StatusMessage>
                {statusMessage.map((msg) => (
                  <span key={msg}>{t(msg)}</span>
                ))}
              </StatusMessage>
            )}
            {!statusMessage && isSuccess && gitChanges?.length === 0 && (
              <EmptyChangesMessage />
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0">
            {!isError && gitChanges?.length === 0 && (
              <div className="max-w-2xl mb-4 text-m bg-tertiary rounded-xl p-4 text-left mx-auto">
                <RandomTip />
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0">
        {/* Left: File Tree */}
        <div className="flex flex-col w-[240px] min-w-[180px] border-r border-white/[0.06] shrink-0">
          <ChangesToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            stats={stats}
            artifactCount={artifactCount}
            showArtifacts={showArtifacts}
            onToggleArtifacts={() => setShowArtifacts(!showArtifacts)}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            allExpanded={expandedPaths.size > 0}
          />
          <div className="flex-1 min-h-0">
            <FileTree
              flatNodes={flatNodes}
              selectedPath={selectedPath}
              onSelectFile={handleSelectFile}
              onToggleDir={toggleExpanded}
            />
          </div>
        </div>

        {/* Right: Diff Viewer */}
        <div className="flex-1 min-w-0">
          <DiffPanel
            selectedFile={selectedFile}
            allFiles={allVisibleFiles}
            onNavigate={handleSelectFile}
          />
        </div>
      </div>
    </main>
  );
}

export default GitChanges;
