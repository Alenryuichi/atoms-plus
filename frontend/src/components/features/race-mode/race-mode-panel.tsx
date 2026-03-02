import { useRaceModeStore } from "#/stores/race-mode-store";
import { RaceModeToggle } from "./race-mode-toggle";
import { RaceModeModelSelector } from "./race-mode-model-selector";
import { RaceModeResults } from "./race-mode-results";

/**
 * Race Mode control panel - displayed above the chat input
 */
export function RaceModePanel() {
  const { isEnabled } = useRaceModeStore();

  return (
    <div className="space-y-3">
      {/* Toggle always visible */}
      <div className="flex items-center justify-between">
        <RaceModeToggle />
      </div>

      {/* Model selector only shown when enabled */}
      {isEnabled && <RaceModeModelSelector />}

      {/* Results */}
      <RaceModeResults />
    </div>
  );
}
