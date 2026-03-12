import { IconRefresh } from "@tabler/icons-react";
import { useUnifiedGetGitChanges } from "#/hooks/query/use-unified-get-git-changes";

type ConversationTabTitleProps = {
  title: string;
  conversationKey: string;
};

export function ConversationTabTitle({
  title,
  conversationKey,
}: ConversationTabTitleProps) {
  const { refetch } = useUnifiedGetGitChanges();

  const isEditorTab = conversationKey === "editor";
  const displayTitle = isEditorTab ? "更改" : title;

  return (
    <div className="flex flex-col w-full border-b border-white/10">
      <div className="flex flex-row items-center justify-between py-2 px-4 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/70">
            {displayTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center justify-center p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            onClick={() => refetch()}
          >
            <IconRefresh size={14} stroke={1.5} className="text-white/40" />
          </button>
        </div>
      </div>
    </div>
  );
}
