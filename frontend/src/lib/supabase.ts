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

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean =>
  Boolean(supabaseUrl && supabaseAnonKey);

// Validate environment variables (warning only, don't throw)
if (!isSupabaseConfigured()) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase environment variables not configured. Some features may not work.",
  );
}

// Create Supabase client only if configured, otherwise null
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured()
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Export types for convenience
export type { Database } from "./supabase.types";
