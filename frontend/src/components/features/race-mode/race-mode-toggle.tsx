import { useTranslation } from "react-i18next";
import { cn } from "#/utils/utils";
import { useRaceModeStore } from "#/stores/race-mode-store";

interface RaceModeToggleProps {
  compact?: boolean;
}

export function RaceModeToggle({ compact = false }: RaceModeToggleProps) {
  const { t } = useTranslation();
  const { isEnabled, toggleEnabled } = useRaceModeStore();

  return (
    <button
      type="button"
      onClick={toggleEnabled}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
        "border hover:border-primary",
        isEnabled
          ? "bg-primary/10 border-primary text-primary"
          : "bg-base-secondary border-tertiary-light text-content-secondary",
      )}
      title={t("RACE_MODE$TOGGLE_TOOLTIP")}
    >
      <span className="text-lg">🏁</span>
      {!compact && (
        <span className="text-sm font-medium">
          {isEnabled ? t("RACE_MODE$ENABLED") : t("RACE_MODE$DISABLED")}
        </span>
      )}
      <div
        className={cn(
          "w-8 h-4 rounded-full flex items-center px-0.5 transition-all",
          isEnabled
            ? "bg-primary justify-end"
            : "bg-tertiary-light justify-start",
        )}
      >
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            isEnabled ? "bg-white" : "bg-content-secondary",
          )}
        />
      </div>
    </button>
  );
}
