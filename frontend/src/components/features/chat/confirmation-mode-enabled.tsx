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
          <div className="flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-[#25272D]">
            <LockIcon width={15} height={15} />
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white text-black">
          {t(I18nKey.COMMON$CONFIRMATION_MODE_ENABLED)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConfirmationModeEnabled;
