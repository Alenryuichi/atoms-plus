/**
 * Supabase Auth Context
 *
 * Provides authentication state management using Supabase Auth.
 * This is a simplified auth flow for the Atoms Plus application.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "#/lib/supabase";

// Check if running in mock mode
const isMockMode = import.meta.env.VITE_MOCK_API === "true";

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (
    email: string,
    password: string,
    captchaToken?: string,
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    captchaToken?: string,
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signInWithGitHub: () => Promise<{ error: AuthError | null }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(
  undefined,
);

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoading(false);
      return undefined;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, captchaToken?: string) => {
      if (!supabase)
        return { error: { message: "Supabase not configured" } as AuthError };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      return { error };
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string, captchaToken?: string) => {
      if (!supabase)
        return { error: { message: "Supabase not configured" } as AuthError };
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      return { error };
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const signInWithGitHub = useCallback(async () => {
    if (!supabase)
      return { error: { message: "Supabase not configured" } as AuthError };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  }, []);

  const value = useMemo<SupabaseAuthContextType>(
    () => ({
      user,
      session,
      isLoading,
      // In mock mode, always consider the user as authenticated
      isAuthenticated: isMockMode || !!session,
      signIn,
      signUp,
      signOut,
      signInWithGitHub,
    }),
    [user, session, isLoading, signIn, signUp, signOut, signInWithGitHub],
  );

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error(
      "useSupabaseAuth must be used within a SupabaseAuthProvider",
    );
  }
  return context;
}
