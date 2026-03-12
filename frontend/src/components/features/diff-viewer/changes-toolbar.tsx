import {
  IconSearch,
  IconChevronDown,
  IconChevronRight,
  IconEyeOff,
  IconEye,
} from "@tabler/icons-react";
import { cn } from "#/utils/utils";

interface ChangesToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  stats: { total: number; added: number; deleted: number; modified: number };
  artifactCount: number;
  showArtifacts: boolean;
  onToggleArtifacts: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  allExpanded: boolean;
}

export function ChangesToolbar({
  searchQuery,
  onSearchChange,
  stats,
  artifactCount,
  showArtifacts,
  onToggleArtifacts,
  onExpandAll,
  onCollapseAll,
  allExpanded,
}: ChangesToolbarProps) {
  return (
    <div className="flex flex-col gap-1.5 px-2 py-1.5 border-b border-white/[0.06]">
      {/* Search */}
      <div className="relative">
        <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter files..."
          className="w-full pl-7 pr-2 py-1 text-xs bg-white/[0.03] border border-white/[0.06] rounded text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-white/[0.12] transition-colors"
        />
      </div>

      {/* Stats + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-neutral-400">{stats.total} files</span>
          {stats.added > 0 && (
            <span className="text-green-400/70">+{stats.added}</span>
          )}
          {stats.deleted > 0 && (
            <span className="text-red-400/70">-{stats.deleted}</span>
          )}
          {stats.modified > 0 && (
            <span className="text-blue-400/70">~{stats.modified}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {artifactCount > 0 && (
            <button
              type="button"
              onClick={onToggleArtifacts}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors",
                showArtifacts
                  ? "text-amber-400/80 bg-amber-500/10"
                  : "text-neutral-500 hover:text-neutral-400",
              )}
              title={
                showArtifacts
                  ? `Hide ${artifactCount} build artifacts`
                  : `Show ${artifactCount} build artifacts`
              }
            >
              {showArtifacts ? (
                <IconEye className="w-3 h-3" />
              ) : (
                <IconEyeOff className="w-3 h-3" />
              )}
              {artifactCount}
            </button>
          )}

          <button
            type="button"
            onClick={allExpanded ? onCollapseAll : onExpandAll}
            className="p-0.5 text-neutral-500 hover:text-neutral-400 transition-colors"
            title={allExpanded ? "Collapse all" : "Expand all"}
          >
            {allExpanded ? (
              <IconChevronDown className="w-3.5 h-3.5" />
            ) : (
              <IconChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
