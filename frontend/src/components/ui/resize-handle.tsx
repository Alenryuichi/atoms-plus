import { cn } from "#/utils/utils";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export function ResizeHandle({ onMouseDown, className }: ResizeHandleProps) {
  return (
    <div
      className={cn(
        "relative w-px bg-white/[0.06] cursor-ew-resize group hover:bg-white/[0.14] transition-colors",
        className,
      )}
      onMouseDown={onMouseDown}
    >
      {/* Larger hit area for easier dragging */}
      <div className="absolute inset-y-0 -left-2 -right-2" />
    </div>
  );
}
