/**
 * Supabase Database Types
 *
 * Types based on the database schema.
 * These types provide type safety when querying Supabase.
 */

// Simple row types for tables
export interface CreditBalance {
  id: string;
  user_id: string;
  balance: number;
  lifetime_credits: number;
  lifetime_spend: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string | null;
  title: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  years_of_experience: number | null;
  target_roles: string[] | null;
  core_skills: string[] | null;
  industries: string[] | null;
  education_summary: string | null;
  ai_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Empty Database type for Supabase client (untyped mode)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Database {}
