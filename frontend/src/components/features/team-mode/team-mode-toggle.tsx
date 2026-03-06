import { Switch, Tooltip } from "@heroui/react";
import { useTeamModeStore } from "#/stores/team-mode-store";
import { cn } from "#/utils/utils";

interface TeamModeToggleProps {
  /** Compact mode for inline usage */
  compact?: boolean;
}

/**
 * Toggle switch to enable/disable Team Mode
 */
export function TeamModeToggle({ compact = false }: TeamModeToggleProps) {
  const { isEnabled, toggleEnabled, isRunning } = useTeamModeStore();

  if (compact) {
    return (
      <Tooltip
        content={
          isEnabled
            ? "Team Mode: Multi-agent collaboration active"
            : "Enable Team Mode for multi-agent collaboration"
        }
      >
        <button
          onClick={toggleEnabled}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
            "border",
            isEnabled
              ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/50 text-purple-300"
              : "bg-default-100 border-default-200 text-default-500 hover:border-purple-400/50 hover:text-purple-400",
            isRunning && "opacity-50 cursor-not-allowed",
          )}
        >
          <span>👥</span>
          <span>Team</span>
          {isEnabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          )}
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        isSelected={isEnabled}
        onValueChange={toggleEnabled}
        isDisabled={isRunning}
        size="sm"
        classNames={{
          wrapper: cn(
            "group-data-[selected=true]:bg-gradient-to-r",
            "group-data-[selected=true]:from-purple-500",
            "group-data-[selected=true]:to-blue-500",
          ),
        }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">Team Mode</span>
        <span className="text-xs text-default-500">
          {isEnabled
            ? "Multi-agent collaboration active"
            : "Enable multi-agent collaboration"}
        </span>
      </div>
    </div>
  );
}
