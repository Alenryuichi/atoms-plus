/**
 * Supabase Service Exports
 *
 * Central export point for all Supabase-related services.
 */

export { default as CreditsService } from "./credits.api";
export type {
  CreditBalanceResponse,
  CreditTransactionInput,
} from "./credits.api";

// Re-export Supabase client and utilities
export { supabase, isSupabaseConfigured } from "#/lib/supabase";
export type {
  Database,
  CreditBalance,
  CreditTransaction,
  Conversation,
  Message,
  UserProfile,
} from "#/lib/supabase.types";
