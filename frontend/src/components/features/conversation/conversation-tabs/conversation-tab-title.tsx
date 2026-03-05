import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUnifiedGetGitChanges } from "#/hooks/query/use-unified-get-git-changes";
import {
  useConversationStore,
  type PreviewViewMode,
} from "#/stores/conversation-store";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

type ConversationTabTitleProps = {
  title: string;
  conversationKey: string;
  onPreviewRefresh?: () => void;
};

export function ConversationTabTitle({
  title,
  conversationKey,
  onPreviewRefresh,
}: ConversationTabTitleProps) {
  const { t } = useTranslation();
  const { refetch } = useUnifiedGetGitChanges();
  const { previewViewMode, setPreviewViewMode } = useConversationStore();

  const handleRefresh = () => {
    if (conversationKey === "preview" && onPreviewRefresh) {
      onPreviewRefresh();
    } else {
      refetch();
    }
  };

  const isPreviewTab = conversationKey === "preview";
  const showRefreshButton = conversationKey === "editor" || isPreviewTab;

  return (
    // Atoms Plus: Glass effect header with amber accent
    <div className="flex flex-row items-center justify-between border-b border-white/10 py-2.5 px-4 bg-black/20">
      <span className="text-sm font-semibold text-neutral-200">{title}</span>

      <div className="flex items-center gap-1.5">
        {/* Preview tab: View mode toggle (Split/Code/Preview) */}
        {isPreviewTab && (
          <div className="flex bg-black/30 rounded-lg p-0.5 border border-white/10">
            {(["split", "editor", "preview"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPreviewViewMode(mode as PreviewViewMode)}
                className={cn(
                  "px-2 py-0.5 text-xs rounded-md transition-all font-medium",
                  previewViewMode === mode
                    ? "bg-amber-500 text-black shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200",
                )}
              >
                {
                  {
                    split: t(I18nKey.COMMON$SPLIT),
                    editor: t(I18nKey.COMMON$CODE),
                    preview: t(I18nKey.COMMON$PREVIEW),
                  }[mode]
                }
              </button>
            ))}
          </div>
        )}

        {/* Refresh button */}
        {showRefreshButton && (
          <button
            type="button"
            className="flex items-center justify-center p-1.5 rounded-lg hover:bg-black/30 hover:text-amber-500 transition-all cursor-pointer"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5 text-neutral-400" />
          </button>
        )}
      </div>
    </div>
  );
}
