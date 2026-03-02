/**
 * Credits Display Component
 *
 * Shows the user's current credit balance in the sidebar.
 * Displays a coin icon with the balance amount.
 */

import React from "react";
import { useCredits } from "#/hooks/query/use-credits";
import { isSupabaseConfigured } from "#/lib/supabase";
import { cn } from "#/utils/utils";

interface CreditsDisplayProps {
  className?: string;
}

function formatCredits(balance: number): string {
  if (balance >= 1000000) {
    return `${(balance / 1000000).toFixed(1)}M`;
  }
  if (balance >= 1000) {
    return `${(balance / 1000).toFixed(1)}K`;
  }
  return balance.toLocaleString();
}

export function CreditsDisplay({ className }: CreditsDisplayProps) {
  const { data: credits, isLoading } = useCredits();

  // Don't show if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return null;
  }

  const balance = credits?.balance ?? 0;

  return (
    <div
      data-testid="credits-display"
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-700/50 hover:bg-neutral-600/50 transition-colors cursor-pointer",
        className,
      )}
      title={`Balance: ${balance.toLocaleString()} credits`}
    >
      {/* Coin Icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-yellow-400"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          fill="currentColor"
          fillOpacity="0.2"
        />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fill="currentColor"
          fontSize="10"
          fontWeight="bold"
        >
          ¢
        </text>
      </svg>

      {/* Balance Text */}
      <span className="text-xs font-medium text-neutral-200">
        {isLoading ? "..." : formatCredits(balance)}
      </span>
    </div>
  );
}
