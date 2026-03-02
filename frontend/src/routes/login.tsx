/* eslint-disable i18next/no-literal-string */
import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useSupabaseAuth } from "#/context/supabase-auth-context";
import { isSupabaseConfigured } from "#/lib/supabase";

// Cloudflare Turnstile Site Key
const TURNSTILE_SITE_KEY = "0x4AAAAAACkzH2JkHuDAArJd";

// Declare Turnstile types
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (container: HTMLElement) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const { isAuthenticated, isLoading, signIn, signUp, signInWithGitHub } =
    useSupabaseAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const turnstileRef = React.useRef<HTMLDivElement>(null);

  // Load Turnstile script and render widget
  React.useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!document.getElementById("turnstile-script")) {
      const script = document.createElement("script");
      script.id = "turnstile-script";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      document.head.appendChild(script);
    }

    // Render widget when script is loaded
    const renderWidget = () => {
      if (
        turnstileRef.current &&
        window.turnstile &&
        !turnstileRef.current.hasChildNodes()
      ) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(null),
          theme: "dark",
        });
      }
    };

    // Check if script is already loaded
    if (window.turnstile) {
      renderWidget();
    } else {
      // Wait for script to load
      const checkScript = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkScript);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(checkScript);
    }
    return undefined;
  }, []);

  // Redirect authenticated users away from login page
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, returnTo]);

  // If Supabase is not configured, redirect to home (OSS mode behavior)
  React.useEffect(() => {
    if (!isSupabaseConfigured()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!captchaToken) {
      setError("Please complete the captcha verification");
      return;
    }

    setIsSubmitting(true);

    const { error: authError } = isSignUp
      ? await signUp(email, password, captchaToken)
      : await signIn(email, password, captchaToken);

    setIsSubmitting(false);

    // Reset captcha after submission
    if (window.turnstile && turnstileRef.current) {
      window.turnstile.reset(turnstileRef.current);
      setCaptchaToken(null);
    }

    if (authError) {
      setError(authError.message);
    } else if (isSignUp) {
      setError("Account created! You can now sign in.");
    }
  };

  const handleGitHubLogin = async () => {
    setError(null);
    const { error: authError } = await signInWithGitHub();
    if (authError) {
      setError(authError.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-base p-4"
      data-testid="login-page"
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Atoms Plus</h1>
          <p className="mt-2 text-gray-400">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div
              className={`p-3 rounded-md text-sm ${
                error.includes("Check your email")
                  ? "bg-green-900/50 text-green-300"
                  : "bg-red-900/50 text-red-300"
              }`}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password"
              />
            </div>
          </div>

          {/* Cloudflare Turnstile Captcha */}
          <div
            ref={turnstileRef}
            className="flex justify-center"
            data-testid="turnstile-container"
          />

          <button
            type="submit"
            disabled={isSubmitting || !captchaToken}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {isSubmitting && "Loading..."}
            {!isSubmitting && isSignUp && "Create Account"}
            {!isSubmitting && !isSignUp && "Sign In"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-base text-gray-400">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGitHubLogin}
          className="w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-md border border-neutral-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign in with GitHub
        </button>

        <p className="text-center text-sm text-gray-400">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-blue-400 hover:text-blue-300"
          >
            {isSignUp ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </main>
  );
}
