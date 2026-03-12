import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ConversationStatus } from "#/types/conversation-status";
import { cn, getConversationStatusLabel } from "#/utils/utils";
import { I18nKey } from "#/i18n/declaration";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";

interface ConversationStatusIndicatorProps {
  conversationStatus: ConversationStatus;
}

export function ConversationStatusIndicator({
  conversationStatus,
}: ConversationStatusIndicatorProps) {
  const { t } = useTranslation();

  const conversationStatusBackgroundColor = useMemo(() => {
    switch (conversationStatus) {
      case "STOPPED":
        return "bg-white/25";
      case "RUNNING":
        return "bg-emerald-400/90";
      case "STARTING":
        return "bg-amber-300/90";
      case "ERROR":
        return "bg-rose-400/90";
      default:
        return "bg-white/25";
    }
  }, [conversationStatus]);

  const statusLabel = t(
    getConversationStatusLabel(conversationStatus) as I18nKey,
  );

  return (
    <StyledTooltip
      content={statusLabel}
      placement="right"
      showArrow
      tooltipClassName="border border-white/10 bg-[#101012] text-white text-xs shadow-lg"
    >
      <div
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          conversationStatusBackgroundColor,
        )}
      />
    </StyledTooltip>
  );
}
