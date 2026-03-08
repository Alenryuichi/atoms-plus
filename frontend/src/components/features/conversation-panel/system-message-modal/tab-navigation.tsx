import { useTranslation } from "react-i18next";
import { cn } from "#/utils/utils";

interface TabNavigationProps {
  activeTab: "system" | "tools";
  onTabChange: (tab: "system" | "tools") => void;
  hasTools: boolean;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  hasTools,
}: TabNavigationProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex gap-1 p-1 bg-white/5 rounded-lg mb-4"
      role="tablist"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "system"}
        onClick={() => onTabChange("system")}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
          activeTab === "system"
            ? "bg-white/10 text-white shadow-sm"
            : "text-white/50 hover:text-white/70 hover:bg-white/5",
        )}
      >
        {t("SYSTEM_MESSAGE_MODAL$SYSTEM_MESSAGE_TAB")}
      </button>
      {hasTools && (
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "tools"}
          onClick={() => onTabChange("tools")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
            activeTab === "tools"
              ? "bg-white/10 text-white shadow-sm"
              : "text-white/50 hover:text-white/70 hover:bg-white/5",
          )}
        >
          {t("SYSTEM_MESSAGE_MODAL$TOOLS_TAB")}
        </button>
      )}
    </div>
  );
}
