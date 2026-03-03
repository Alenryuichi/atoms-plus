import { RefreshCw } from "lucide-react";
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

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="flex flex-row items-center justify-between border-b border-border/50 py-2.5 px-4">
      <span className="text-sm font-semibold text-foreground">{title}</span>
      {conversationKey === "editor" && (
        <button
          type="button"
          className="flex items-center justify-center p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
