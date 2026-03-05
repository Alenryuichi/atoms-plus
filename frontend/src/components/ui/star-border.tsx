import React from "react";
import { cn } from "#/lib/utils";

type StarBorderProps<T extends React.ElementType> =
  React.ComponentPropsWithoutRef<T> & {
    as?: T;
    className?: string;
    children?: React.ReactNode;
    color?: string;
    speed?: React.CSSProperties["animationDuration"];
    thickness?: number;
    /** Custom classes for inner content wrapper. Set to empty string to remove default styling. */
    innerClassName?: string;
  };

export function StarBorder<T extends React.ElementType = "button">({
  as,
  className = "",
  color = "#d4a855", // Amber accent color
  speed = "6s",
  thickness = 1,
  innerClassName,
  children,
  ...rest
}: StarBorderProps<T>) {
  const Component = as || "button";

  // Default inner styling, can be overridden
  const defaultInnerClass =
    "relative z-10 bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 text-white text-center py-3 px-6 rounded-xl";

  return (
    <Component
      className={cn(
        "relative inline-block overflow-hidden rounded-xl",
        className,
      )}
      {...(rest as React.ComponentPropsWithoutRef<T>)}
      style={{
        padding: `${thickness}px 0`,
        ...(rest as React.ComponentPropsWithoutRef<T>).style,
      }}
    >
      {/* Bottom star movement */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      {/* Top star movement */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      {/* Content */}
      <div
        className={
          innerClassName !== undefined ? innerClassName : defaultInnerClass
        }
      >
        {children}
      </div>
    </Component>
  );
}

export default StarBorder;
