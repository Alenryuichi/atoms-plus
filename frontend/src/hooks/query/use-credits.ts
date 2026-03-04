/**
 * useCredits Hook
 *
 * React Query hook for fetching and managing user credits.
 * Integrates with Supabase for credit balance tracking.
 * Uses the authenticated user's UUID from Supabase Auth.
 */

import { useQuery } from "@tanstack/react-query";
import { CreditsService, isSupabaseConfigured } from "#/api/supabase-service";
import { useSupabaseAuth } from "#/context/supabase-auth-context";

export const CREDITS_QUERY_KEY = "credits";

interface UseCreditsOptions {
  enabled?: boolean;
}

export function useCredits(options: UseCreditsOptions = {}) {
  const { enabled = true } = options;
  const { user, isAuthenticated } = useSupabaseAuth();

  // Get the user's UUID from Supabase Auth
  const userId = user?.id;

  return useQuery({
    queryKey: [CREDITS_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return null;
      const balance = await CreditsService.getBalance(userId);
      return balance;
    },
    // Only fetch if user is authenticated and Supabase is configured
    enabled: enabled && isSupabaseConfigured() && isAuthenticated && !!userId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

export function useCreditTransactions(options: UseCreditsOptions = {}) {
  const { enabled = true } = options;
  const { user, isAuthenticated } = useSupabaseAuth();

  const userId = user?.id;

  return useQuery({
    queryKey: [CREDITS_QUERY_KEY, "transactions", userId],
    queryFn: async () => {
      if (!userId) return [];
      const transactions = await CreditsService.getTransactionHistory(userId);
      return transactions;
    },
    enabled: enabled && isSupabaseConfigured() && isAuthenticated && !!userId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}
