import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { LoadingSpinner } from "#/components/shared/loading-spinner";

type ConversationLoadingProps = {
  className?: string;
};

export function ConversationLoading({ className }: ConversationLoadingProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        // Atoms Plus: Transparent background - let parent card show through
        "bg-transparent flex flex-col items-center justify-center h-full w-full",
        className,
      )}
    >
      <LoadingSpinner size="large" />
      <span className="text-lg font-medium text-neutral-400 pt-4">
        {t(I18nKey.HOME$LOADING)}
      </span>
    </div>
  );
}
