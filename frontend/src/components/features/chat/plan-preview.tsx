import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, FileText } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { MarkdownRenderer } from "#/components/features/markdown/markdown-renderer";
import { useHandleBuildPlanClick } from "#/hooks/use-handle-build-plan-click";
import { useSelectConversationTab } from "#/hooks/use-select-conversation-tab";
import {
  planComponents,
  createPlanComponents,
} from "#/components/features/markdown/plan-components";
import { useScrollContext } from "#/context/scroll-context";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "#/components/ui/card";
import { Button } from "#/components/ui/button";

const MAX_CONTENT_LENGTH = 300;

// Shine effect class for streaming text
const SHINE_TEXT_CLASS = "shine-text";

// Plan components with shine effect applied for streaming state
const shineComponents = createPlanComponents(SHINE_TEXT_CLASS);

interface PlanPreviewProps {
  /** Raw plan content from PLAN.md file */
  planContent?: string | null;
  /** Whether the plan content is actively being streamed */
  isStreaming?: boolean;
  /** Whether the Build button should be disabled (e.g., while streaming) */
  isBuildDisabled?: boolean;
}

/* eslint-disable i18next/no-literal-string */
export function PlanPreview({
  planContent,
  isStreaming,
  isBuildDisabled,
}: PlanPreviewProps) {
  const { t } = useTranslation();
  const { navigateToTab } = useSelectConversationTab();
  const { handleBuildPlanClick } = useHandleBuildPlanClick();
  const { scrollDomToBottom } = useScrollContext();

  const handleViewClick = () => {
    navigateToTab("planner");
  };

  // Handle Build action with scroll to bottom
  const handleBuildClick = useCallback(
    (event?: React.MouseEvent<HTMLButtonElement>) => {
      handleBuildPlanClick(event);
      scrollDomToBottom();
    },
    [handleBuildPlanClick, scrollDomToBottom],
  );

  // Truncate plan content for preview
  const truncatedContent = useMemo(() => {
    if (!planContent) return "";
    if (planContent.length <= MAX_CONTENT_LENGTH) return planContent;
    return `${planContent.slice(0, MAX_CONTENT_LENGTH)}...`;
  }, [planContent]);

  if (!planContent) {
    return null;
  }

  return (
    <Card className="border-primary/30 shadow-card mt-2">
      {/* Header */}
      <CardHeader className="p-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {t(I18nKey.COMMON$PLAN_MD)}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleViewClick}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
            data-testid="plan-preview-view-button"
          >
            <span>{t(I18nKey.COMMON$VIEW)}</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent
        data-testid="plan-preview-content"
        className="p-4 text-sm text-foreground leading-relaxed"
      >
        {truncatedContent && (
          <>
            <MarkdownRenderer
              includeStandard
              components={isStreaming ? shineComponents : planComponents}
            >
              {truncatedContent}
            </MarkdownRenderer>
            {planContent && planContent.length > MAX_CONTENT_LENGTH && (
              <button
                type="button"
                onClick={handleViewClick}
                className="text-primary cursor-pointer hover:underline text-left mt-2"
                data-testid="plan-preview-read-more-button"
              >
                {t(I18nKey.COMMON$READ_MORE)}
              </button>
            )}
          </>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-3 pt-0">
        <Button
          onClick={handleBuildClick}
          disabled={isBuildDisabled}
          size="sm"
          className="gap-2"
          data-testid="plan-preview-build-button"
        >
          {t(I18nKey.COMMON$BUILD)}
          <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground/20 rounded">
            ⌘↩
          </kbd>
        </Button>
      </CardFooter>
    </Card>
  );
}
