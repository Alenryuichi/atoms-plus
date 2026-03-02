import { useTranslation } from "react-i18next";
import { useState } from "react";
import { cn } from "#/utils/utils";
import { useRaceModeStore } from "#/stores/race-mode-store";
import { useRaceModels } from "#/hooks/query/use-race-models";
import { RaceResult } from "#/api/race-mode-service/race-mode-service.types";

function ResultCard({
  result,
  displayName,
  isWinner,
  isSelected,
  onSelect,
}: {
  result: RaceResult;
  displayName: string;
  isWinner: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const hasError = !!result.error;

  const getCardClassName = () => {
    if (hasError) return "border-danger/50 bg-danger/5";
    if (isWinner) return "border-success bg-success/5";
    if (isSelected) return "border-primary bg-primary/5";
    return "border-tertiary-light bg-base-secondary hover:border-primary/50";
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        getCardClassName(),
        !hasError && "cursor-pointer",
      )}
      onClick={() => !hasError && onSelect()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{displayName}</span>
          {isWinner && (
            <span className="text-xs bg-success text-white px-2 py-0.5 rounded-full">
              {t("RACE_MODE$WINNER")}
            </span>
          )}
        </div>
        {!hasError && (
          <div className="flex items-center gap-3 text-xs text-content-secondary">
            <span>
              {result.execution_time.toFixed(2)}
              {t("RACE_MODE$TIME").toLowerCase().charAt(0) === "t" ? "s" : "s"}
            </span>
            <span>
              {result.token_count} {t("RACE_MODE$TOKENS").toLowerCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {hasError ? (
        <div className="text-sm text-danger">{result.error}</div>
      ) : (
        <div className="text-sm text-content-primary whitespace-pre-wrap max-h-48 overflow-y-auto">
          {result.response}
        </div>
      )}
    </div>
  );
}

export function RaceModeResults() {
  const { t } = useTranslation();
  const { currentSession, selectedWinner, setSelectedWinner, isRacing } =
    useRaceModeStore();
  const { data: modelsData } = useRaceModels();
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  if (isRacing) {
    return (
      <div className="flex items-center justify-center py-8 gap-3">
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <div className="animate-spin text-2xl" aria-hidden="true">
          🏎️
        </div>
        <span className="text-content-secondary">{t("RACE_MODE$RACING")}</span>
      </div>
    );
  }

  if (!currentSession || currentSession.results.length === 0) {
    return null;
  }

  const getDisplayName = (modelName: string) =>
    modelsData?.details[modelName]?.display || modelName;

  // Sort results by execution time (fastest first, errors last)
  const sortedResults = [...currentSession.results].sort((a, b) => {
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    return a.execution_time - b.execution_time;
  });

  return (
    <div className="space-y-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          🏁 {t("RACE_MODE$RESULTS")}
          <span className="text-xs text-content-secondary">
            ({currentSession.results.length} {t("RACE_MODE$MODELS")})
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={cn(
              "px-2 py-1 text-xs rounded",
              viewMode === "cards"
                ? "bg-primary text-white"
                : "bg-base-secondary",
            )}
          >
            {t("RACE_MODE$CARDS_VIEW")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "px-2 py-1 text-xs rounded",
              viewMode === "table"
                ? "bg-primary text-white"
                : "bg-base-secondary",
            )}
          >
            {t("RACE_MODE$TABLE_VIEW")}
          </button>
        </div>
      </div>

      {/* Results */}
      <div
        className={cn(viewMode === "cards" ? "space-y-3" : "overflow-x-auto")}
      >
        {viewMode === "cards" ? (
          sortedResults.map((result, index) => (
            <ResultCard
              key={result.model_name}
              result={result}
              displayName={getDisplayName(result.model_name)}
              isWinner={index === 0 && !result.error}
              isSelected={selectedWinner === result.model_name}
              onSelect={() => setSelectedWinner(result.model_name)}
            />
          ))
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-content-secondary">
              <tr className="border-b border-tertiary-light">
                <th className="py-2 px-2">{t("RACE_MODE$MODEL")}</th>
                <th className="py-2 px-2">{t("RACE_MODE$TIME")}</th>
                <th className="py-2 px-2">{t("RACE_MODE$TOKENS")}</th>
                <th className="py-2 px-2">{t("RACE_MODE$STATUS")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result) => (
                <tr
                  key={result.model_name}
                  className="border-b border-tertiary-light/50"
                >
                  <td className="py-2 px-2">
                    {getDisplayName(result.model_name)}
                  </td>
                  <td className="py-2 px-2">
                    {`${result.execution_time.toFixed(2)}s`}
                  </td>
                  <td className="py-2 px-2">{result.token_count}</td>
                  <td className="py-2 px-2">
                    {result.error ? (
                      <span className="text-danger" aria-label="Error">
                        &#x274C;
                      </span>
                    ) : (
                      <span className="text-success" aria-label="Success">
                        &#x2705;
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
