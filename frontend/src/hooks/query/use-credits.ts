/**
 * useCredits Hook
 *
 * React Query hook for fetching and managing user credits.
 * Integrates with Supabase for credit balance tracking.
 */

import { useQuery } from "@tanstack/react-query";
import { CreditsService, isSupabaseConfigured } from "#/api/supabase-service";

export const CREDITS_QUERY_KEY = "credits";

// Mock user ID for demo - in production, get from auth context
const DEMO_USER_ID = "demo-user-001";

interface UseCreditsOptions {
  userId?: string;
  enabled?: boolean;
}

export function useCredits(options: UseCreditsOptions = {}) {
  const { userId = DEMO_USER_ID, enabled = true } = options;

  return useQuery({
    queryKey: [CREDITS_QUERY_KEY, userId],
    queryFn: async () => {
      const balance = await CreditsService.getBalance(userId);
      return balance;
    },
    enabled: enabled && isSupabaseConfigured(),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

export function useCreditTransactions(options: UseCreditsOptions = {}) {
  const { userId = DEMO_USER_ID, enabled = true } = options;

  return useQuery({
    queryKey: [CREDITS_QUERY_KEY, "transactions", userId],
    queryFn: async () => {
      const transactions = await CreditsService.getTransactionHistory(userId);
      return transactions;
    },
    enabled: enabled && isSupabaseConfigured(),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}
