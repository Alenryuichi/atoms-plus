import React, { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "#/lib/utils";

export interface ShuffleTextProps {
  text: string;
  className?: string;
  duration?: number;
  charset?: string;
  triggerOnHover?: boolean;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
}

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

export function ShuffleText({
  text,
  className,
  duration = 50,
  charset = DEFAULT_CHARSET,
  triggerOnHover = true,
  tag: Tag = "span",
}: ShuffleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iterationRef = useRef(0);

  const scramble = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    iterationRef.current = 0;

    const targetText = text;
    const totalIterations = targetText.length;

    intervalRef.current = setInterval(() => {
      setDisplayText((prev) => {
        const chars = targetText.split("");
        return chars
          .map((char, index) => {
            // Keep spaces as spaces
            if (char === " ") return " ";
            // Characters that have been revealed stay revealed
            if (index < iterationRef.current) return targetText[index];
            // Scramble remaining characters
            return charset[Math.floor(Math.random() * charset.length)];
          })
          .join("");
      });

      iterationRef.current += 0.5;

      if (iterationRef.current >= totalIterations) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setDisplayText(targetText);
        setIsAnimating(false);
      }
    }, duration);
  }, [text, duration, charset, isAnimating]);

  // Initial animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scramble();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    },
    [],
  );

  const handleMouseEnter = () => {
    if (triggerOnHover) {
      scramble();
    }
  };

  return (
    <Tag
      className={cn("inline-block cursor-default", className)}
      onMouseEnter={handleMouseEnter}
    >
      {displayText}
    </Tag>
  );
}

export default ShuffleText;
