import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import TachometerFastIcon from "#/icons/tachometer-fast.svg?react";
import PrStatusIcon from "#/icons/pr-status.svg?react";
import DocumentIcon from "#/icons/document.svg?react";
import WaterIcon from "#/icons/u-water.svg?react";

export type Suggestion = { label: I18nKey | string; value: string };

interface SuggestionItemProps {
  suggestion: Suggestion;
  onClick: (value: string) => void;
}

export function SuggestionItem({ suggestion, onClick }: SuggestionItemProps) {
  const { t } = useTranslation();

  // Atoms Plus: Amber accent for suggestion icons
  const itemIcon = useMemo(() => {
    const iconColor = "#d4a855"; // amber-500
    switch (suggestion.label) {
      case "INCREASE_TEST_COVERAGE":
        return <TachometerFastIcon width={24} height={24} color={iconColor} />;
      case "AUTO_MERGE_PRS":
        return <PrStatusIcon width={19} height={20} color={iconColor} />;
      case "FIX_README":
        return <DocumentIcon width={24} height={24} color={iconColor} />;
      case "CLEAN_DEPENDENCIES":
        return <WaterIcon width={24} height={24} color={iconColor} />;
      default:
        return null;
    }
  }, [suggestion]);

  return (
    <button
      type="button"
      // Atoms Plus: Glass effect suggestion button
      className="list-none bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-black/50 hover:border-amber-500/30 flex-1 flex items-center justify-center cursor-pointer gap-3 h-14 px-4 transition-all duration-200"
      onClick={() => onClick(suggestion.value)}
    >
      {itemIcon}
      <span
        data-testid="suggestion"
        className="text-sm font-medium text-neutral-300"
      >
        {t(suggestion.label)}
      </span>
    </button>
  );
}
