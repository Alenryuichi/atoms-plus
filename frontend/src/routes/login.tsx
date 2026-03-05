/* eslint-disable i18next/no-literal-string */
import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useSupabaseAuth } from "#/context/supabase-auth-context";
import { isSupabaseConfigured } from "#/lib/supabase";
import { AtomsPlusLogo } from "#/assets/branding/atoms-plus-logo";
import { DarkVeil } from "#/components/ui/dark-veil";
import { StarBorder } from "#/components/ui/star-border";

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

// Check if we're in mock mode
const isMockMode = import.meta.env.VITE_MOCK_API === "true";

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

  // In mock mode, allow skipping login
  const handleMockLogin = () => {
    navigate(returnTo, { replace: true });
  };

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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500/30 border-t-amber-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <main
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-testid="login-page"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <DarkVeil
          hueShift={30}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.4}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <StarBorder
          as="div"
          color="#d4a855"
          speed="8s"
          className="w-full"
          innerClassName="relative z-10"
        >
          <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-8 space-y-8 border border-amber-500/10">
            {/* Logo & Header */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
                <AtomsPlusLogo
                  width={80}
                  height={80}
                  className="relative z-10"
                />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-white tracking-tight">
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </h1>
                <p className="mt-1 text-sm text-neutral-400">
                  {isSignUp
                    ? "Start building with AI-powered development"
                    : "Sign in to continue your journey"}
                </p>
              </div>
            </div>

            {/* Error/Success Message */}
            {error && (
              <div
                className={`p-3 rounded-lg text-sm backdrop-blur-sm ${
                  error.includes("created") || error.includes("Check")
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="relative group">
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
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300"
                    placeholder="Email address"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                <div className="relative group">
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
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300"
                    placeholder="Password"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>

              {/* Cloudflare Turnstile Captcha */}
              <div
                ref={turnstileRef}
                className="flex justify-center"
                data-testid="turnstile-container"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !captchaToken}
                className="relative w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-amber-800/50 disabled:to-amber-700/50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-300 overflow-hidden group"
              >
                <span className="relative z-10">
                  {isSubmitting && "Signing in..."}
                  {!isSubmitting && isSignUp && "Create Account"}
                  {!isSubmitting && !isSignUp && "Sign In"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/20 to-amber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-black/70 text-neutral-500 uppercase tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            {/* GitHub Button */}
            <button
              type="button"
              onClick={handleGitHubLogin}
              className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <svg
                className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-neutral-300 group-hover:text-white transition-colors">
                Sign in with GitHub
              </span>
            </button>

            {/* Mock Mode: Continue as Guest */}
            {isMockMode && (
              <button
                type="button"
                onClick={handleMockLogin}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Continue as Guest (Dev Mode)
              </button>
            )}

            {/* Toggle Sign Up/In */}
            {!isMockMode && (
              <p className="text-center text-sm text-neutral-500">
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                >
                  {isSignUp ? "Sign in" : "Create one"}
                </button>
              </p>
            )}
          </div>
        </StarBorder>

        {/* Bottom Text */}
        <p className="mt-6 text-center text-xs text-neutral-600">
          By signing in, you agree to our{" "}
          <a
            href="/terms"
            className="text-neutral-500 hover:text-amber-500 transition-colors"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-neutral-500 hover:text-amber-500 transition-colors"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}
