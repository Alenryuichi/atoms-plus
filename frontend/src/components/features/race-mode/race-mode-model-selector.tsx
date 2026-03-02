import { useTranslation } from "react-i18next";
import { useState } from "react";
import { cn } from "#/utils/utils";
import { useRaceModeStore } from "#/stores/race-mode-store";
import { useRaceModels } from "#/hooks/query/use-race-models";

export function RaceModeModelSelector() {
  const { t } = useTranslation();
  const { selectedModels, toggleModel } = useRaceModeStore();
  const { data: modelsData, isLoading, error } = useRaceModels();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="text-sm text-content-secondary p-2">
        {t("RACE_MODE$LOADING_MODELS")}
      </div>
    );
  }

  if (error || !modelsData) {
    return (
      <div className="text-sm text-danger p-2">
        {t("RACE_MODE$ERROR_LOADING_MODELS")}
      </div>
    );
  }

  const { models, details } = modelsData;

  // Group models by provider
  const groupedModels = models.reduce<Record<string, string[]>>(
    (acc, model) => {
      const provider = details[model]?.provider || "other";
      if (!acc[provider]) acc[provider] = [];
      acc[provider].push(model);
      return acc;
    },
    {},
  );

  return (
    <div className="rounded-lg border border-tertiary-light bg-base-secondary overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-base-tertiary"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {t("RACE_MODE$SELECT_MODELS")}
          </span>
          <span className="text-xs text-content-secondary bg-tertiary-light px-2 py-0.5 rounded-full">
            {selectedModels.length}
          </span>
        </div>
        <span
          className={cn(
            "text-lg transition-transform",
            isExpanded && "rotate-180",
          )}
          aria-hidden="true"
          // eslint-disable-next-line i18next/no-literal-string
          dangerouslySetInnerHTML={{ __html: "&#x25BC;" }}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-tertiary-light max-h-64 overflow-y-auto p-2 space-y-3">
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider}>
              <div className="text-xs text-content-secondary uppercase tracking-wider mb-1 px-1">
                {provider}
              </div>
              <div className="space-y-1">
                {providerModels.map((model) => {
                  const info = details[model];
                  const isSelected = selectedModels.includes(model);
                  return (
                    <button
                      key={model}
                      type="button"
                      onClick={() => toggleModel(model)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm",
                        "hover:bg-base-tertiary transition-colors",
                        isSelected && "bg-primary/10 text-primary",
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center",
                          isSelected
                            ? "bg-primary border-primary text-white"
                            : "border-tertiary-light",
                        )}
                      >
                        {isSelected && "✓"}
                      </div>
                      <span>{info?.display || model}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
