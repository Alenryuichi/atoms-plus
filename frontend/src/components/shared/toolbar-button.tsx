import React from "react";
import { cn } from "#/utils/utils";

interface ToolbarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * Reusable toolbar button component for browser-style toolbars.
 * Used in ServedTab, BrowserPanel, and similar preview panels.
 */
export function ToolbarButton({
  onClick,
  disabled,
  children,
  className,
  "aria-label": ariaLabel,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
        disabled
          ? "text-neutral-600 cursor-not-allowed"
          : "text-neutral-500 hover:text-white hover:bg-white/5",
        className,
      )}
    >
      {children}
    </button>
  );
}
