import { useTranslation } from "react-i18next";
import ReactJsonView from "@microlink/react-json-view";
import { JSON_VIEW_THEME } from "#/utils/constants";

interface ToolParametersProps {
  parameters: Record<string, unknown>;
}

export function ToolParameters({ parameters }: ToolParametersProps) {
  const { t } = useTranslation();

  return (
    <div data-testid="tool-parameters">
      <div className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
        {t("SYSTEM_MESSAGE_MODAL$PARAMETERS")}
      </div>
      <div className="text-sm p-3 bg-black/30 border border-white/5 rounded-lg overflow-auto max-h-[300px] custom-scrollbar-always">
        <ReactJsonView
          name={false}
          src={parameters}
          theme={JSON_VIEW_THEME}
          style={{ backgroundColor: "transparent" }}
        />
      </div>
    </div>
  );
}
