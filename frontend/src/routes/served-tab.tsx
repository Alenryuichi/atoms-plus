import React, { useCallback, useEffect, useRef } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconRefresh,
  IconExternalLink,
  IconCopy,
  IconServer,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useUnifiedActiveHost } from "#/hooks/query/use-unified-active-host";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { ToolbarButton } from "#/components/shared/toolbar-button";

function ServedApp() {
  const { t } = useTranslation();
  const { activeHost } = useUnifiedActiveHost();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [currentActiveHost, setCurrentActiveHost] = React.useState<
    string | null
  >(null);
  const [path, setPath] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const url = new URL(e.target.value);
      setCurrentActiveHost(url.origin);
      setPath(`${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Invalid URL, ignore
    }
  };

  const resetUrl = useCallback(() => {
    setCurrentActiveHost(activeHost);
    setPath("");
  }, [activeHost]);

  useEffect(() => {
    resetUrl();
  }, [resetUrl]);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  const fullUrl = React.useMemo(() => {
    if (!currentActiveHost) return "";
    try {
      return new URL(path || "/", currentActiveHost).toString();
    } catch {
      return currentActiveHost;
    }
  }, [currentActiveHost, path]);
  const displayUrl = currentActiveHost
    ? fullUrl.replace(/^https?:\/\//, "")
    : "";

  const copyUrl = useCallback(async () => {
    if (fullUrl) {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [fullUrl]);

  // Empty state - no server running
  if (!currentActiveHost) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-10">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-neutral-800/50 border border-white/[0.06] flex items-center justify-center mb-6">
          <IconServer className="w-10 h-10 text-neutral-500" stroke={1.5} />
        </div>

        {/* Text */}
        <h3 className="text-lg font-medium text-white mb-2">
          {t(I18nKey.SERVED_APP$NO_SERVER_TITLE)}
        </h3>
        <p className="text-sm text-neutral-500 mb-6 max-w-xs text-center">
          {t(I18nKey.SERVED_APP$NO_SERVER_DESCRIPTION)}
        </p>

        {/* Quick tip */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <span className="text-xs text-neutral-400" aria-hidden="true">
            💡
          </span>
          <span className="text-xs text-neutral-400">
            {t(I18nKey.SERVED_APP$TIP_PREFIX)}
          </span>
          <code className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
            {t(I18nKey.SERVED_APP$TIP_COMMAND)}
          </code>
        </div>
      </div>
    );
  }

  // Active state - server running with browser-style toolbar
  return (
    <div className="h-full w-full flex flex-col">
      {/* Browser-style toolbar */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-white/10 bg-neutral-900">
        {/* Navigation buttons group */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => {}}
            disabled
            aria-label={t(I18nKey.BUTTON$BACK)}
          >
            <IconArrowLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {}}
            disabled
            aria-label={t(I18nKey.BUTTON$FORWARD)}
          >
            <IconArrowRight className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setRefreshKey((prev) => prev + 1)}
            aria-label={t(I18nKey.BUTTON$REFRESH)}
          >
            <IconRefresh className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
          {/* Connection status indicator */}
          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={displayUrl}
            onChange={handleUrlChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                inputRef.current?.blur();
              }
            }}
            className="flex-1 bg-transparent text-xs text-neutral-300 outline-none min-w-0"
            aria-label={t(I18nKey.SERVED_APP$URL_INPUT)}
          />
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
          onClick={() => window.open(fullUrl, "_blank")}
          aria-label={t(I18nKey.BUTTON$OPEN_IN_NEW_TAB)}
        >
          <IconExternalLink className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* iframe */}
      <iframe
        key={refreshKey}
        title={t(I18nKey.SERVED_APP$TITLE)}
        src={fullUrl}
        className="w-full flex-1 custom-scrollbar-always"
      />
    </div>
  );
}

export default ServedApp;
