import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LuFilePlus, LuFileMinus, LuFileDiff, LuFilePen } from "react-icons/lu";
import { cn } from "#/utils/utils";
import type { FlatTreeNode } from "#/hooks/use-file-tree";
import type { GitChangeStatus } from "#/api/open-hands.types";

const STATUS_CONFIG: Record<
  GitChangeStatus,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  A: { icon: LuFilePlus, color: "text-green-400" },
  U: { icon: LuFilePlus, color: "text-green-400" },
  D: { icon: LuFileMinus, color: "text-red-400" },
  M: { icon: LuFileDiff, color: "text-blue-400" },
  R: { icon: LuFilePen, color: "text-yellow-400" },
};

interface FileTreeProps {
  flatNodes: FlatTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onToggleDir: (path: string) => void;
}

export function FileTree({
  flatNodes,
  selectedPath,
  onSelectFile,
  onToggleDir,
}: FileTreeProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
    overscan: 15,
  });

  if (flatNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-neutral-500">
        No files
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto custom-scrollbar"
    >
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = flatNodes[virtualRow.index];
          const { node, isExpanded, depth } = item;

          return (
            <div
              key={node.path}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className={cn(
                "absolute top-0 left-0 w-full flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer transition-colors select-none",
                "hover:bg-white/[0.05]",
                selectedPath === node.path && "bg-white/[0.08]",
              )}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                paddingLeft: `${depth * 14 + 8}px`,
              }}
              onClick={() => {
                if (node.isDirectory) {
                  onToggleDir(node.path);
                } else {
                  onSelectFile(node.path);
                }
              }}
            >
              {node.isDirectory ? (
                <>
                  <span
                    className={cn(
                      "text-[10px] text-neutral-500 transition-transform inline-block w-3",
                      isExpanded && "rotate-90",
                    )}
                  >
                    ▶
                  </span>
                  <span className="text-neutral-300 truncate">
                    {node.name}
                  </span>
                  <span className="text-neutral-600 ml-auto shrink-0 text-[10px]">
                    {node.fileCount}
                  </span>
                </>
              ) : (
                <>
                  <FileStatusIcon status={node.status} />
                  <span
                    className={cn(
                      "truncate",
                      selectedPath === node.path
                        ? "text-neutral-100"
                        : "text-neutral-400",
                    )}
                  >
                    {node.name}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FileStatusIcon({ status }: { status?: GitChangeStatus }) {
  if (!status) return <span className="w-3.5" />;
  const config = STATUS_CONFIG[status];
  if (!config) return <span className="w-3.5" />;
  const Icon = config.icon;
  return <Icon className={cn("w-3.5 h-3.5 shrink-0", config.color)} />;
}
