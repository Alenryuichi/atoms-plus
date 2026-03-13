import { useState, useEffect } from "react";
import type { ResearchPhase } from "#/stores/research-store";

export function useElapsedTimer(phase: ResearchPhase): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (phase !== "researching" && phase !== "connecting") {
      setElapsed(0);
      return undefined;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);
  return elapsed;
}

export function formatElapsed(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}
