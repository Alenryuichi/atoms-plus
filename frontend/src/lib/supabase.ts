/**
 * Supabase Client Configuration
 *
 * This module initializes and exports the Supabase client for use throughout the application.
 * It uses environment variables for configuration to support different environments.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./supabase.types";

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase environment variables not configured. Some features may not work.",
  );
}

// Create Supabase client with type safety
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || "",
  supabaseAnonKey || "",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean =>
  Boolean(supabaseUrl && supabaseAnonKey);

// Export types for convenience
export type { Database } from "./supabase.types";
