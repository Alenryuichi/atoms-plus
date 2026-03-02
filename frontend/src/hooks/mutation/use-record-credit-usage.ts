/**
 * useRecordCreditUsage Hook
 *
 * Mutation hook for recording credit usage when AI features are used.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditsService, CreditTransactionInput } from "#/api/supabase-service";
import { CREDITS_QUERY_KEY } from "../query/use-credits";

// Mock user ID for demo - in production, get from auth context
const DEMO_USER_ID = "demo-user-001";

interface UseRecordCreditUsageOptions {
  userId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useRecordCreditUsage(
  options: UseRecordCreditUsageOptions = {},
) {
  const { userId = DEMO_USER_ID, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      transaction: Omit<CreditTransactionInput, "type"> & { type?: string },
    ) => {
      const result = await CreditsService.recordTransaction(userId, {
        amount: transaction.amount,
        type: (transaction.type as CreditTransactionInput["type"]) || "usage",
        description: transaction.description,
      });

      if (!result) {
        throw new Error("Failed to record credit transaction");
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate credits query to refresh balance
      queryClient.invalidateQueries({ queryKey: [CREDITS_QUERY_KEY, userId] });
      queryClient.invalidateQueries({
        queryKey: [CREDITS_QUERY_KEY, "transactions", userId],
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      // eslint-disable-next-line no-console
      console.error("Failed to record credit usage:", error);
      onError?.(error);
    },
  });
}
