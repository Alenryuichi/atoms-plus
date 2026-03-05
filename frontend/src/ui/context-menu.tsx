import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#/utils/utils";

const contextMenuVariants = cva(
  // Atoms Plus: Glass effect context menu with amber accent
  "absolute bg-black/80 backdrop-blur-xl rounded-xl text-neutral-300 overflow-hidden z-50 border border-amber-500/20 shadow-2xl shadow-black/40",
  {
    variants: {
      size: {
        compact: "py-1 px-1",
        default: "py-2 px-2",
      },
      layout: {
        vertical: "flex flex-col gap-1",
      },
      position: {
        top: "bottom-full",
        bottom: "top-full",
      },
      spacing: {
        default: "mt-2",
      },
      alignment: {
        left: "left-0",
        right: "right-0",
      },
    },
    defaultVariants: {
      size: "default",
      layout: "vertical",
      spacing: "default",
    },
  },
);

interface ContextMenuProps {
  ref?: React.RefObject<HTMLUListElement | null>;
  testId?: string;
  children: React.ReactNode;
  className?: React.HTMLAttributes<HTMLUListElement>["className"];
  size?: VariantProps<typeof contextMenuVariants>["size"];
  layout?: VariantProps<typeof contextMenuVariants>["layout"];
  position?: VariantProps<typeof contextMenuVariants>["position"];
  spacing?: VariantProps<typeof contextMenuVariants>["spacing"];
  alignment?: VariantProps<typeof contextMenuVariants>["alignment"];
}

export function ContextMenu({
  testId,
  children,
  className,
  ref,
  size,
  layout,
  position,
  spacing,
  alignment,
}: ContextMenuProps) {
  return (
    <ul
      data-testid={testId}
      ref={ref}
      className={cn(
        contextMenuVariants({ size, layout, position, spacing, alignment }),
        className,
      )}
    >
      {children}
    </ul>
  );
}
