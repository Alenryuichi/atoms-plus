import { ReactNode, useRef, type MouseEvent } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#/utils/utils";

const cardVariants = cva(
  // Premium card: subtle border, smooth transitions, hover effect with spotlight
  "spotlight-card w-full flex flex-col rounded-xl p-5 bg-[var(--atoms-bg-card)] border border-[var(--atoms-border-subtle)] relative transition-all duration-300 hover:border-[var(--atoms-border)]",
  {
    variants: {
      gap: {
        default: "gap-3",
        large: "gap-6",
      },
      minHeight: {
        default: "min-h-[280px] md:min-h-auto",
        small: "min-h-[260px]",
        none: "",
      },
      interactive: {
        true: "hover:-translate-y-0.5 hover:shadow-lg cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      gap: "default",
      minHeight: "default",
      interactive: false,
    },
  },
);

interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode;
  className?: string;
  testId?: string;
  spotlightColor?: string;
}

export function Card({
  children,
  className = "",
  testId,
  gap,
  minHeight,
  interactive,
  spotlightColor = "rgba(212, 168, 85, 0.15)",
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
    cardRef.current.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <div
      ref={cardRef}
      data-testid={testId}
      onMouseMove={handleMouseMove}
      className={cn(cardVariants({ gap, minHeight, interactive }), className)}
      style={
        {
          "--mouse-x": "50%",
          "--mouse-y": "50%",
          "--spotlight-color": spotlightColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
