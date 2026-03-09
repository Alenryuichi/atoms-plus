import {
  IconRefresh,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconExternalLink,
  IconDots,
  IconChevronDown,
  IconCode,
  IconLayout2,
  IconFolder,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useUnifiedGetGitChanges } from "#/hooks/query/use-unified-get-git-changes";
import { useConversationStore } from "#/stores/conversation-store";
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
  const {
    previewViewMode,
    setPreviewViewMode,
    previewSubTab,
    setPreviewSubTab,
  } = useConversationStore();

  const handleRefresh = () => {
    if (conversationKey === "preview" && onPreviewRefresh) {
      onPreviewRefresh();
    } else {
      refetch();
    }
  };

  const isPreviewTab = conversationKey === "preview";
  const isEditorTab = conversationKey === "editor";

  // Atoms Plus: Display titles matching reference screenshot
  let displayTitle = title;
  if (isPreviewTab) displayTitle = "App Viewer";
  if (isEditorTab) displayTitle = "更改";

  return (
    <div className="flex flex-col w-full border-b border-white/10">
      {/* Main Header */}
      <div className="flex flex-row items-center justify-between py-2 px-4 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {isPreviewTab && <IconLayout2 size={16} className="text-white/40" />}
          <span className="text-xs font-medium text-white/70">
            {displayTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {(isPreviewTab || isEditorTab) && (
            <>
              {isPreviewTab && (
                <div className="flex items-center gap-1 pr-2 border-r border-white/10">
                  <button className="p-1 text-white/40 hover:text-white/90 transition-colors">
                    <IconDeviceMobile size={16} />
                  </button>
                  <button className="p-1 text-white/90 transition-colors">
                    <IconDeviceDesktop size={16} />
                  </button>
                </div>
              )}

              {isPreviewTab && (
                <button className="p-1 text-white/40 hover:text-white/90 transition-colors">
                  <IconFolder size={16} />
                </button>
              )}

              <button
                className="p-1 text-white/40 hover:text-white/90 transition-colors cursor-pointer"
                onClick={handleRefresh}
              >
                <IconRefresh size={16} />
              </button>

              {isPreviewTab && (
                <button className="p-1 text-white/40 hover:text-white/90 transition-colors">
                  <IconExternalLink size={16} />
                </button>
              )}

              <button className="p-1 text-white/40 hover:text-white/90 transition-colors">
                <IconDots size={16} />
              </button>
            </>
          )}

          {!isPreviewTab && !isEditorTab && (
            <button
              type="button"
              className="flex items-center justify-center p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              onClick={handleRefresh}
            >
              <IconRefresh size={14} stroke={1.5} className="text-white/40" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-toolbar - Design / URL / Console */}
      {isPreviewTab && (
        <div className="flex items-center justify-between py-1.5 px-4 bg-white/[0.01] border-t border-white/5">
          {/* Left: Design Toggle */}
          <button
            onClick={() => setPreviewSubTab("design")}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 transition-colors group cursor-pointer"
          >
            <span
              className={cn(
                "text-[11px] font-semibold transition-colors",
                previewSubTab === "design"
                  ? "text-white"
                  : "text-white/40 group-hover:text-white/80",
              )}
            >
              Design
            </span>
            <IconChevronDown
              size={12}
              className={cn(
                "transition-colors",
                previewSubTab === "design" ? "text-white/80" : "text-white/40",
              )}
            />
          </button>

          {/* Center: URL Path */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-md min-w-[120px]">
            <span className="text-[10px] text-white/40">/</span>
            <div className="flex items-center gap-1 ml-auto">
              <IconExternalLink
                size={12}
                className="text-white/30 hover:text-white/60 cursor-pointer"
              />
              <IconRefresh
                size={12}
                className="text-white/30 hover:text-white/60 cursor-pointer"
                onClick={handleRefresh}
              />
            </div>
          </div>

          {/* Right: Console Toggle */}
          <button
            onClick={() => setPreviewSubTab("console")}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 transition-colors group cursor-pointer"
          >
            <IconCode
              size={14}
              className={cn(
                "transition-colors",
                previewSubTab === "console"
                  ? "text-amber-400"
                  : "text-white/40",
              )}
            />
            <span
              className={cn(
                "text-[11px] font-semibold transition-colors",
                previewSubTab === "console"
                  ? "text-amber-400"
                  : "text-white/40 group-hover:text-white/70",
              )}
            >
              Console
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
