import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import { I18nKey } from "#/i18n/declaration";
import LockIcon from "#/icons/lock.svg?react";
import { useSettings } from "#/hooks/query/use-settings";

function ConfirmationModeEnabled() {
  const { t } = useTranslation();

  const { data: settings } = useSettings();

  if (!settings?.confirmation_mode) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={t(I18nKey.COMMON$CONFIRMATION_MODE_ENABLED)}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/62 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
          >
            <LockIcon width={15} height={15} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="border border-white/10 bg-[#101012] text-white">
          {t(I18nKey.COMMON$CONFIRMATION_MODE_ENABLED)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConfirmationModeEnabled;
