import { useMemo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconFileText } from "@tabler/icons-react";
import { I18nKey } from "#/i18n/declaration";
import { MarkdownRenderer } from "#/components/features/markdown/markdown-renderer";
import { useHandleBuildPlanClick } from "#/hooks/use-handle-build-plan-click";
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

const SHINE_TEXT_CLASS = "shine-text";

const shineComponents = createPlanComponents(SHINE_TEXT_CLASS);

interface PlanPreviewProps {
  planContent?: string | null;
  isStreaming?: boolean;
  isBuildDisabled?: boolean;
}

/* eslint-disable i18next/no-literal-string */
export function PlanPreview({
  planContent,
  isStreaming,
  isBuildDisabled,
}: PlanPreviewProps) {
  const { t } = useTranslation();
  const { handleBuildPlanClick } = useHandleBuildPlanClick();
  const { scrollDomToBottom } = useScrollContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBuildClick = useCallback(
    (event?: React.MouseEvent<HTMLButtonElement>) => {
      handleBuildPlanClick(event);
      scrollDomToBottom();
    },
    [handleBuildPlanClick, scrollDomToBottom],
  );

  const displayContent = useMemo(() => {
    if (!planContent) return "";
    if (isExpanded || planContent.length <= MAX_CONTENT_LENGTH)
      return planContent;
    return `${planContent.slice(0, MAX_CONTENT_LENGTH)}...`;
  }, [planContent, isExpanded]);

  if (!planContent) {
    return null;
  }

  return (
    <Card className="border-primary/30 shadow-card mt-2">
      <CardHeader className="p-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <IconFileText size={16} stroke={1.5} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {t(I18nKey.COMMON$PLAN_MD)}
          </span>
        </div>
      </CardHeader>

      <CardContent
        data-testid="plan-preview-content"
        className="p-4 text-sm text-foreground leading-relaxed"
      >
        {displayContent && (
          <>
            <MarkdownRenderer
              includeStandard
              components={isStreaming ? shineComponents : planComponents}
            >
              {displayContent}
            </MarkdownRenderer>
            {!isExpanded && planContent.length > MAX_CONTENT_LENGTH && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-primary cursor-pointer hover:underline text-left mt-2"
                data-testid="plan-preview-read-more-button"
              >
                {t(I18nKey.COMMON$READ_MORE)}
              </button>
            )}
          </>
        )}
      </CardContent>

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
