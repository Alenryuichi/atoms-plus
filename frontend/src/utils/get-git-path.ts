/**
 * Get the git repository path for a conversation
 * If a repository is selected, returns /workspace/{repo-name}
 * Otherwise, returns /workspace (the default workspace root)
 *
 * Note: OpenHands initializes git in /workspace (workspace_mount_path_in_sandbox),
 * so we must use /workspace as the default path, not /workspace/project.
 *
 * @param selectedRepository The selected repository (e.g., "OpenHands/OpenHands" or "owner/repo")
 * @returns The git path to use
 */
export function getGitPath(
  selectedRepository: string | null | undefined,
): string {
  if (!selectedRepository) {
    // Default workspace root - this is where git init is performed
    return "/workspace";
  }

  // Extract the repository name from "owner/repo" format
  // The folder name is the second part after "/"
  const parts = selectedRepository.split("/");
  const repoName = parts.length > 1 ? parts[1] : parts[0];

  // Cloned repositories are placed directly under /workspace
  return `/workspace/${repoName}`;
}
