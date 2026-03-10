import React, { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { IconCopy, IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { BrowserSnapshot } from "./browser-snapshot";
import { EmptyBrowserMessage } from "./empty-browser-message";
import { useConversationId } from "#/hooks/use-conversation-id";
import { useBrowserStore } from "#/stores/browser-store";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { ToolbarButton } from "#/components/shared/toolbar-button";

export function BrowserPanel() {
  const { t } = useTranslation();
  const { url, screenshotSrc, reset } = useBrowserStore();
  const { conversationId } = useConversationId();
  const [copied, setCopied] = React.useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reset();
  }, [conversationId, reset]);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  const imgSrc = screenshotSrc?.startsWith("data:image/png;base64,")
    ? screenshotSrc
    : `data:image/png;base64,${screenshotSrc ?? ""}`;

  const displayUrl = url ? url.replace(/^https?:\/\//, "") : "";

  const copyUrl = useCallback(async () => {
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  // Empty state - no screenshot
  if (!screenshotSrc) {
    return (
      <div className="h-full w-full flex flex-col">
        <EmptyBrowserMessage />
      </div>
    );
  }

  // Has screenshot - show browser-style toolbar
  return (
    <div className="h-full w-full flex flex-col">
      {/* Browser-style toolbar */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-white/10 bg-neutral-900">
        {/* Refresh button */}
        <ToolbarButton onClick={reset} aria-label={t(I18nKey.BUTTON$REFRESH)}>
          <IconRefresh className="w-4 h-4" />
        </ToolbarButton>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
          {/* Connection status indicator */}
          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <span className="flex-1 text-xs text-neutral-300 truncate">
            {displayUrl}
          </span>
          <ToolbarButton
            onClick={copyUrl}
            className="!w-6 !h-6"
            aria-label={t(I18nKey.BUTTON$COPY_URL)}
          >
            <IconCopy
              className={cn("w-3.5 h-3.5", copied && "text-green-400")}
            />
          </ToolbarButton>
        </div>

        {/* Open in new tab */}
        <ToolbarButton
          onClick={() => window.open(url, "_blank")}
          aria-label={t(I18nKey.BUTTON$OPEN_IN_NEW_TAB)}
        >
          <IconExternalLink className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Screenshot */}
      <div className="overflow-y-auto grow scrollbar-hide">
        <BrowserSnapshot src={imgSrc} />
      </div>
    </div>
  );
}
