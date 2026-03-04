import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/utils/utils";
import { I18nKey } from "#/i18n/declaration";

interface ConversationVersionBadgeProps {
  version?: "V0" | "V1";
  isConversationArchived?: boolean;
}

export function ConversationVersionBadge({
  version,
  isConversationArchived,
}: ConversationVersionBadgeProps) {
  const { t } = useTranslation();

  if (!version) return null;

  const tooltipText =
    version === "V1"
      ? t(I18nKey.CONVERSATION$VERSION_V1_NEW)
      : t(I18nKey.CONVERSATION$VERSION_V0_LEGACY);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 cursor-help lowercase bg-neutral-500/20 text-neutral-400",
              isConversationArchived && "opacity-60",
            )}
          >
            {version}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
