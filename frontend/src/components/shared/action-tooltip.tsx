import { useTranslation } from "react-i18next";
import { IconCheck, IconX } from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

interface ActionTooltipProps {
  type: "confirm" | "reject";
  onClick: () => void;
}

export function ActionTooltip({ type, onClick }: ActionTooltipProps) {
  const { t } = useTranslation();

  const isConfirm = type === "confirm";

  const ariaLabel = isConfirm
    ? t(I18nKey.ACTION$CONFIRM)
    : t(I18nKey.ACTION$REJECT);

  const content = isConfirm
    ? t(I18nKey.CHAT_INTERFACE$USER_CONFIRMED)
    : t(I18nKey.CHAT_INTERFACE$USER_REJECTED);

  const buttonLabel = isConfirm
    ? `${t(I18nKey.CHAT_INTERFACE$INPUT_CONTINUE_MESSAGE)} ⌘↩`
    : `${t(I18nKey.BUTTON$CANCEL)} ⇧⌘⌫`;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            data-testid={`action-${type}-button`}
            type="button"
            aria-label={ariaLabel}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors shadow-sm font-medium",
              type === "confirm"
                ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                : "bg-neutral-800 hover:bg-neutral-700 text-white/80 hover:text-white",
            )}
            onClick={onClick}
          >
            {isConfirm ? (
              <IconCheck size={16} stroke={2.5} />
            ) : (
              <IconX size={16} stroke={2} />
            )}
            <span className="text-sm">{buttonLabel}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
