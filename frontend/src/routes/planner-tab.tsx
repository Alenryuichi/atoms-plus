import React from "react";
import { useTranslation } from "react-i18next";
import { IconClipboardList } from "@tabler/icons-react";
import { I18nKey } from "#/i18n/declaration";
import { useConversationStore } from "#/stores/conversation-store";
import { useScrollToBottom } from "#/hooks/use-scroll-to-bottom";
import { MarkdownRenderer } from "#/components/features/markdown/markdown-renderer";
import { planComponents } from "#/components/features/markdown/plan-components";
import { useHandlePlanClick } from "#/hooks/use-handle-plan-click";

function PlannerTab() {
  const { t } = useTranslation();
  const { scrollRef: scrollContainerRef, onChatBodyScroll } = useScrollToBottom(
    React.useRef<HTMLDivElement>(null),
  );

  const { planContent } = useConversationStore();
  const { handlePlanClick } = useHandlePlanClick();

  // Has plan content - render markdown
  if (planContent !== null && planContent !== undefined) {
    return (
      <div
        ref={scrollContainerRef}
        onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        className="flex flex-col w-full h-full p-4 overflow-auto"
      >
        <MarkdownRenderer includeStandard components={planComponents}>
          {planContent}
        </MarkdownRenderer>
      </div>
    );
  }

  // Empty state - no plan
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-10">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-neutral-800/50 border border-white/[0.06] flex items-center justify-center mb-6">
        <IconClipboardList
          className="w-10 h-10 text-neutral-500"
          stroke={1.5}
        />
      </div>

      {/* Text */}
      <h3 className="text-lg font-medium text-white mb-2">
        {t(I18nKey.PLANNER$EMPTY_TITLE)}
      </h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-xs text-center">
        {t(I18nKey.PLANNER$EMPTY_DESC)}
      </p>

      {/* Create Plan Button */}
      <button
        type="button"
        onClick={handlePlanClick}
        className="px-5 py-2.5 rounded-lg font-medium text-sm bg-white text-black hover:bg-neutral-200 transition-colors"
      >
        {t(I18nKey.COMMON$CREATE_A_PLAN)}
      </button>

      {/* Quick tip */}
      <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <span className="text-xs text-neutral-400" aria-hidden="true">
          💡
        </span>
        <span className="text-xs text-neutral-400">
          {t(I18nKey.SERVED_APP$TIP_PREFIX)}
        </span>
        <code className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
          {t(I18nKey.PLANNER$TIP_COMMAND)}
        </code>
      </div>
    </div>
  );
}

export default PlannerTab;
