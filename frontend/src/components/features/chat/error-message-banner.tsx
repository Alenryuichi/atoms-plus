import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { IconX, IconAlertCircle } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

interface ErrorMessageBannerProps {
  message: string;
  onDismiss?: () => void;
}

const DEFAULT_MAX_COLLAPSED_CHARS = 220;

export function ErrorMessageBanner({
  message,
  onDismiss,
}: ErrorMessageBannerProps) {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const isI18nKey = i18n.exists(message);
  const displayTextForLength = isI18nKey ? String(t(message)) : message;
  const shouldShowToggle =
    displayTextForLength.length > DEFAULT_MAX_COLLAPSED_CHARS;

  const isCollapsed = shouldShowToggle && !isExpanded;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex w-full items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3.5 text-white backdrop-blur-sm"
      data-testid="error-message-banner"
    >
      {/* Icon */}
      <div className="shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
        <IconAlertCircle size={18} className="text-red-400" stroke={2} />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/90">
            {t(I18nKey.COMMON$ERROR)}
          </span>
        </div>

        <div
          className={cn(
            "text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap wrap-break-words",
            isCollapsed && "line-clamp-3",
          )}
          data-testid="error-message-banner-content"
        >
          {isI18nKey ? (
            <Trans
              i18nKey={message}
              components={{
                a: (
                  <Link
                    className="cursor-pointer font-bold text-rose-300 underline hover:text-rose-200"
                    to="/settings/billing"
                  >
                    link
                  </Link>
                ),
              }}
            />
          ) : (
            message
          )}
        </div>

        {shouldShowToggle && (
          <button
            type="button"
            className="text-[11px] text-red-400 hover:text-red-300 font-medium transition-colors"
            onClick={() => setIsExpanded((prev) => !prev)}
            data-testid="error-message-banner-toggle"
          >
            {isExpanded
              ? t(I18nKey.COMMON$VIEW_LESS)
              : t(I18nKey.COMMON$VIEW_MORE)}
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 w-5 h-5 flex items-center justify-center text-white/40 hover:text-white/60 transition-colors"
          aria-label={t(I18nKey.BUTTON$CLOSE)}
          data-testid="error-message-banner-dismiss"
        >
          <IconX size={14} stroke={2} />
        </button>
      )}
    </motion.div>
  );
}
