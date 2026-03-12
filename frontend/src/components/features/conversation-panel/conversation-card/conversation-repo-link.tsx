import { FaBitbucket, FaGithub, FaGitlab, FaUserShield } from "react-icons/fa6";
import { FaCodeBranch } from "react-icons/fa";
import { IconType } from "react-icons/lib";
import { RepositorySelection } from "#/api/open-hands.types";
import { Provider } from "#/types/settings";
import AzureDevOpsLogo from "#/assets/branding/azure-devops-logo.svg?react";

interface ConversationRepoLinkProps {
  selectedRepository: RepositorySelection;
}

const providerIcon: Partial<Record<Provider, IconType>> = {
  bitbucket: FaBitbucket,
  github: FaGithub,
  gitlab: FaGitlab,
  enterprise_sso: FaUserShield,
};

export function ConversationRepoLink({
  selectedRepository,
}: ConversationRepoLinkProps) {
  const Icon = selectedRepository.git_provider
    ? providerIcon[selectedRepository.git_provider]
    : null;

  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex items-center gap-1">
        {Icon && <Icon size={14} className="text-white/48" />}
        {selectedRepository.git_provider === "azure_devops" && (
          <AzureDevOpsLogo className="h-[14px] w-[14px] text-white/48" />
        )}
        <span
          data-testid="conversation-card-selected-repository"
          className="max-w-44 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/48"
        >
          {selectedRepository.selected_repository}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <FaCodeBranch size={12} className="text-white/48" />

        <span
          data-testid="conversation-card-selected-branch"
          className="max-w-24 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/48"
        >
          {selectedRepository.selected_branch}
        </span>
      </div>
    </div>
  );
}
