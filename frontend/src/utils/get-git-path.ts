/**
 * Get the git repository path for a conversation
 *
 * For V1 architecture (ProcessSandboxService):
 * - The working directory is /tmp/openhands-sandboxes/{sandbox_id}
 * - Git is initialized in this directory
 * - We use "." to refer to the current working directory
 *
 * For V0 architecture (LocalRuntime):
 * - The working directory is /workspace
 *
 * @param selectedRepository The selected repository (e.g., "OpenHands/OpenHands" or "owner/repo")
 * @returns The git path to use - "." for workspace root, or repo name for cloned repos
 */
export function getGitPath(
  selectedRepository: string | null | undefined,
): string {
  if (!selectedRepository) {
    // Use "." to refer to the current working directory
    // This works for both V0 (/workspace) and V1 (/tmp/openhands-sandboxes/{id})
    return ".";
  }

  // Extract the repository name from "owner/repo" format
  // The folder name is the second part after "/"
  const parts = selectedRepository.split("/");
  const repoName = parts.length > 1 ? parts[1] : parts[0];

  // Cloned repositories are placed in a subdirectory
  return repoName;
}
