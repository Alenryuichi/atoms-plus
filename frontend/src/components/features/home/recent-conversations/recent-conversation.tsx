import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import CodeBranchIcon from "#/icons/u-code-branch.svg?react";
import { Conversation } from "#/api/open-hands.types";
import { GitProviderIcon } from "#/components/shared/git-provider-icon";
import { Provider } from "#/types/settings";
import { formatTimeDelta } from "#/utils/format-time-delta";
import { I18nKey } from "#/i18n/declaration";
import { ConversationStatusIndicator } from "./conversation-status-indicator";
import RepoForkedIcon from "#/icons/repo-forked.svg?react";

interface RecentConversationProps {
  conversation: Conversation;
}

export function RecentConversation({ conversation }: RecentConversationProps) {
  const { t } = useTranslation();

  const hasRepository =
    conversation.selected_repository && conversation.selected_branch;

  return (
    <Link
      to={`/conversations/${conversation.conversation_id}`}
      className="workbench-item flex w-full cursor-pointer flex-col gap-2 rounded-2xl border border-transparent px-3.5 py-3 text-left transition-all duration-150"
    >
      <div className="flex items-center gap-2">
        <ConversationStatusIndicator conversationStatus={conversation.status} />
        <span className="text-sm font-medium leading-6 text-white/88">
          {conversation.title}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs font-normal leading-4 text-white/48">
        <div className="flex items-center gap-3">
          {hasRepository ? (
            <div className="flex items-center gap-2">
              <GitProviderIcon
                gitProvider={conversation.git_provider as Provider}
              />
              <span
                className="max-w-[124px] truncate"
                title={conversation.selected_repository || ""}
              >
                {conversation.selected_repository}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <RepoForkedIcon width={12} height={12} color="currentColor" />
              <span className="max-w-[124px] truncate">
                {t(I18nKey.COMMON$NO_REPOSITORY)}
              </span>
            </div>
          )}
          {hasRepository ? (
            <div className="flex items-center gap-1">
              <CodeBranchIcon width={12} height={12} color="currentColor" />
              <span
                className="max-w-[124px] truncate"
                title={conversation.selected_branch || ""}
              >
                {conversation.selected_branch}
              </span>
            </div>
          ) : null}
        </div>
        {(conversation.created_at || conversation.last_updated_at) && (
          <span className="tabular-nums">
            {formatTimeDelta(
              conversation.created_at || conversation.last_updated_at,
            )}{" "}
            {t(I18nKey.CONVERSATION$AGO)}
          </span>
        )}
      </div>
    </Link>
  );
}
