import { IoLockClosed } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import { I18nKey } from "#/i18n/declaration";

export function SecurityLock() {
  const { t } = useTranslation();

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/settings"
            className="mr-2 cursor-pointer hover:opacity-80 transition-all"
            aria-label={t(I18nKey.SETTINGS$TITLE)}
          >
            <IoLockClosed size={20} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-2">
          {t(I18nKey.SETTINGS$CONFIRMATION_MODE_LOCK_TOOLTIP)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
