import { useTranslation } from "react-i18next";
import { formatTimeDelta } from "#/utils/format-time-delta";
import { cn } from "#/utils/utils";
import { I18nKey } from "#/i18n/declaration";
import { ConversationRepoLink } from "../conversation-card/conversation-repo-link";
import { NoRepository } from "../conversation-card/no-repository";
import type { RepositorySelection } from "#/api/open-hands.types";

interface StartTaskCardFooterProps {
  selectedRepository: RepositorySelection | null;
  createdAt: string; // ISO 8601
  detail: string | null;
}

export function StartTaskCardFooter({
  selectedRepository,
  createdAt,
  detail,
}: StartTaskCardFooterProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col gap-1 mt-1")}>
      {/* Repository Info */}
      <div className="flex flex-row justify-between items-center">
        {selectedRepository ? (
          <ConversationRepoLink selectedRepository={selectedRepository} />
        ) : (
          <NoRepository />
        )}
        {createdAt && (
          <p className="flex-1 text-right text-xs text-white/48">
            <time>
              {`${formatTimeDelta(createdAt)} ${t(I18nKey.CONVERSATION$AGO)}`}
            </time>
          </p>
        )}
      </div>

      {/* Task Detail */}
      {detail && <div className="truncate text-xs text-white/42">{detail}</div>}
    </div>
  );
}
