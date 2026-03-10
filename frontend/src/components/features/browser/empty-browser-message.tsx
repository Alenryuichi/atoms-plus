import { useTranslation } from "react-i18next";
import { IconWorld } from "@tabler/icons-react";
import { I18nKey } from "#/i18n/declaration";

export function EmptyBrowserMessage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-10">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-neutral-800/50 border border-white/[0.06] flex items-center justify-center mb-6">
        <IconWorld className="w-10 h-10 text-neutral-500" stroke={1.5} />
      </div>

      {/* Text */}
      <h3 className="text-lg font-medium text-white mb-2">
        {t(I18nKey.BROWSER$EMPTY_TITLE)}
      </h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-xs text-center">
        {t(I18nKey.BROWSER$EMPTY_DESC)}
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
          {t(I18nKey.BROWSER$TIP_COMMAND)}
        </code>
      </div>
    </div>
  );
}
