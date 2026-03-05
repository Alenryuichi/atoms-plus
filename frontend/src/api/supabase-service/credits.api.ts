/**
 * Credits API Service
 *
 * Handles all credit-related operations with Supabase:
 * - Get user credit balance
 * - Record credit transactions
 * - Update credit balance
 */

import { supabase, isSupabaseConfigured } from "#/lib/supabase";
import type { CreditBalance, CreditTransaction } from "#/lib/supabase.types";

export interface CreditBalanceResponse {
  balance: number;
  lifetime_credits: number;
  lifetime_spend: number;
}

export interface CreditTransactionInput {
  amount: number;
  type: "usage" | "purchase" | "bonus" | "refund";
  description?: string;
}

/**
 * Create initial credit balance for a new user
 */
async function initializeBalance(
  userId: string,
  initialCredits: number = 100000,
): Promise<CreditBalance | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const insertData = {
    user_id: userId,
    balance: initialCredits,
    lifetime_credits: initialCredits,
    lifetime_spend: 0,
  };

  const { data, error } = await supabase
    .from("credit_balances")
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error initializing credit balance:", error);
    return null;
  }

  return data as CreditBalance;
}

/**
 * Get the current user's credit balance.
 * If the user doesn't have a balance record, automatically initialize one.
 */
async function getBalance(
  userId: string,
): Promise<CreditBalanceResponse | null> {
  if (!isSupabaseConfigured() || !supabase) {
    // eslint-disable-next-line no-console
    console.warn("Supabase not configured, returning mock data");
    return {
      balance: 1000000, // 1M credits for demo
      lifetime_credits: 1000000,
      lifetime_spend: 0,
    };
  }

  const { data, error } = await supabase
    .from("credit_balances")
    .select("balance, lifetime_credits, lifetime_spend")
    .eq("user_id", userId)
    .single();

  if (error) {
    // PGRST116 = "The result contains 0 rows" - user doesn't have a balance yet
    if (error.code === "PGRST116") {
      // Auto-initialize balance for new user
      const initialized = await initializeBalance(userId);
      if (initialized) {
        return {
          balance: initialized.balance,
          lifetime_credits: initialized.lifetime_credits,
          lifetime_spend: initialized.lifetime_spend,
        };
      }
    }
    // eslint-disable-next-line no-console
    console.error("Error fetching credit balance:", error);
    return null;
  }

  return data as CreditBalanceResponse;
}

/**
 * Record a credit transaction and update balance
 */
async function recordTransaction(
  userId: string,
  transaction: CreditTransactionInput,
): Promise<CreditTransaction | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const insertData = {
    user_id: userId,
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
  };

  // Insert transaction record
  const { data: txData, error: txError } = await supabase
    .from("credit_transactions")
    .insert(insertData as never)
    .select()
    .single();

  if (txError) {
    // eslint-disable-next-line no-console
    console.error("Error recording transaction:", txError);
    return null;
  }

  // Update balance based on transaction type
  const balanceChange =
    transaction.type === "usage" ? -transaction.amount : transaction.amount;

  // Try RPC first, then fallback to manual update
  try {
    await supabase.rpc("update_credit_balance", {
      p_user_id: userId,
      p_amount: balanceChange,
    } as never);
  } catch {
    // Fallback to manual update if RPC doesn't exist
    const { data: currentBalance } = await supabase
      .from("credit_balances")
      .select("balance, lifetime_credits, lifetime_spend")
      .eq("user_id", userId)
      .single();

    if (currentBalance) {
      const cb = currentBalance as CreditBalanceResponse;
      const updateData = {
        balance: cb.balance + balanceChange,
        lifetime_spend:
          transaction.type === "usage"
            ? cb.lifetime_spend + transaction.amount
            : cb.lifetime_spend,
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from("credit_balances")
        .update(updateData as never)
        .eq("user_id", userId);
    }
  }

  return txData as CreditTransaction;
}

/**
 * Get transaction history for a user
 */
async function getTransactionHistory(
  userId: string,
  limit: number = 50,
): Promise<CreditTransaction[]> {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching transaction history:", error);
    return [];
  }

  return (data as CreditTransaction[]) || [];
}

const CreditsService = {
  getBalance,
  initializeBalance,
  recordTransaction,
  getTransactionHistory,
};

export default CreditsService;
