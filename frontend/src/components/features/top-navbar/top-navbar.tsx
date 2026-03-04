import React from "react";
import { useLocation, NavLink, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { useGitUser } from "#/hooks/query/use-git-user";
import { UserActions } from "../sidebar/user-actions";
import { CreditsDisplay } from "../sidebar/credits-display";
import { OpenHandsLogoButton } from "#/components/shared/buttons/openhands-logo-button";
import { SettingsModal } from "#/components/shared/modals/settings/settings-modal";
import { useSettings } from "#/hooks/query/use-settings";
import { ConversationPanel } from "../conversation-panel/conversation-panel";
import { ConversationPanelWrapper } from "../conversation-panel/conversation-panel-wrapper";
import { useLogout } from "#/hooks/mutation/use-logout";
import { useConfig } from "#/hooks/query/use-config";
import { useIsAuthed } from "#/hooks/query/use-is-authed";
import { useSupabaseAuth } from "#/context/supabase-auth-context";
import { isSupabaseConfigured } from "#/lib/supabase";
import { displayErrorToast } from "#/utils/custom-toast-handlers";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";

// Resources dropdown items
const RESOURCES_ITEMS = [
  { labelKey: I18nKey.ATOMS$NAV_BLOG, href: "/blog" },
  { labelKey: I18nKey.ATOMS$NAV_USE_CASES, href: "/usecases" },
  { labelKey: I18nKey.ATOMS$NAV_VIDEOS, href: "/videos" },
  {
    labelKey: I18nKey.ATOMS$NAV_GITHUB,
    href: "https://github.com/All-Hands-AI/OpenHands",
    external: true,
  },
];

// Resources Dropdown Component
function ResourcesDropdown({
  t,
}: {
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {t(I18nKey.ATOMS$NAV_RESOURCES)}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 min-w-[160px] rounded-lg bg-neutral-900 border border-neutral-700/50 shadow-xl py-2"
          >
            {RESOURCES_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                {t(item.labelKey)}
                {item.external && (
                  <svg
                    className="h-3 w-3 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                )}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile Menu for authenticated users
interface MobileMenuProps {
  isEmailVerified: boolean;
  conversationPanelIsOpen: boolean;
  setConversationPanelIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: ReturnType<typeof useGitUser>;
  logout: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}

function MobileMenuAuthed({
  isEmailVerified,
  conversationPanelIsOpen,
  setConversationPanelIsOpen,
  user,
  logout,
  t,
}: MobileMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed top-16 left-0 right-0 z-40",
        "bg-[#0a0a0b]/98 backdrop-blur-xl border-b border-neutral-800/50",
        "p-4 md:hidden",
      )}
    >
      <nav className="flex flex-col gap-3">
        {/* New Project Button - Mobile */}
        <NavLink
          to="/"
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-lg",
            "bg-gradient-to-r from-indigo-600 to-purple-600",
            "text-white font-medium text-sm",
            "transition-all duration-200",
            !isEmailVerified && "opacity-50 pointer-events-none",
          )}
          onClick={(e) => !isEmailVerified && e.preventDefault()}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>{t(I18nKey.CONVERSATION$START_NEW)}</span>
        </NavLink>

        {/* Conversations Button - Mobile */}
        <button
          type="button"
          onClick={() =>
            isEmailVerified && setConversationPanelIsOpen((prev) => !prev)
          }
          disabled={!isEmailVerified}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-lg",
            "bg-neutral-800/80 hover:bg-neutral-700/80",
            "text-neutral-300 hover:text-white",
            "font-medium text-sm",
            "border border-neutral-700/50",
            "transition-all duration-200",
            conversationPanelIsOpen && "bg-neutral-700/80 text-white",
            !isEmailVerified && "opacity-50 cursor-not-allowed",
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <span>{t(I18nKey.SIDEBAR$CONVERSATIONS)}</span>
        </button>

        {/* Divider */}
        <div className="border-t border-neutral-800/50 pt-3 mt-1" />

        {/* Pricing Link - Mobile */}
        <NavLink
          to="/pricing"
          className="flex items-center justify-center py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
        >
          {t(I18nKey.ATOMS$NAV_PRICING)}
        </NavLink>

        {/* Resources Links - Mobile (expanded list instead of dropdown) */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2">
            {t(I18nKey.ATOMS$NAV_RESOURCES)}
          </span>
          {RESOURCES_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between py-2 px-2 text-sm text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800/50"
            >
              <span>{t(item.labelKey)}</span>
              {item.external && (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Section */}
        <div className="border-t border-neutral-800/50 pt-4 mt-2">
          <div className="flex items-center justify-between">
            <CreditsDisplay />
            <UserActions
              user={
                user.data ? { avatar_url: user.data.avatar_url } : undefined
              }
              onLogout={logout}
              isLoading={user.isFetching}
            />
          </div>
        </div>
      </nav>
    </motion.div>
  );
}

// Mobile Menu for landing page (unauthenticated)
function MobileMenuLanding({
  t,
  onLogin,
  onSignup,
}: {
  t: ReturnType<typeof useTranslation>["t"];
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed top-16 left-0 right-0 z-40",
        "bg-neutral-900/95 backdrop-blur-md border-b border-neutral-700/40",
        "p-4 md:hidden",
      )}
    >
      <nav className="flex flex-col gap-2">
        <NavLink
          to="/pricing"
          className="py-3 px-4 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          {t(I18nKey.ATOMS$NAV_PRICING)}
        </NavLink>
        <div className="border-t border-neutral-700/40 my-2" />
        <span className="px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
          {t(I18nKey.ATOMS$NAV_RESOURCES)}
        </span>
        {RESOURCES_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className="py-2 px-4 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {t(item.labelKey)}
          </a>
        ))}
        <div className="border-t border-neutral-700/40 my-2" />
        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            className="flex-1 text-neutral-300 hover:text-white"
            onClick={onLogin}
          >
            {t(I18nKey.ATOMS$NAV_LOGIN)}
          </Button>
          <Button
            className="flex-1 bg-white text-black hover:bg-neutral-200"
            onClick={onSignup}
          >
            {t(I18nKey.ATOMS$NAV_SIGNUP)}
          </Button>
        </div>
      </nav>
    </motion.div>
  );
}

export function TopNavbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useGitUser();
  const { data: config } = useConfig();
  const { data: isAuthed } = useIsAuthed();
  const {
    data: settings,
    error: settingsError,
    isError: settingsIsError,
    isFetching: isFetchingSettings,
  } = useSettings();
  const { mutate: logout } = useLogout();

  // Supabase auth state
  const { isAuthenticated: isSupabaseAuthed } = useSupabaseAuth();

  // Use Supabase auth if configured, otherwise use the original auth
  const useSupabaseAuthFlow = isSupabaseConfigured();
  const effectiveIsAuthed = useSupabaseAuthFlow ? isSupabaseAuthed : isAuthed;

  const [settingsModalIsOpen, setSettingsModalIsOpen] = React.useState(false);
  const [conversationPanelIsOpen, setConversationPanelIsOpen] =
    React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Determine if we're on the landing page (home page and not authenticated)
  const isLandingPage = pathname === "/" && !effectiveIsAuthed;

  React.useEffect(() => {
    if (pathname === "/settings") {
      setSettingsModalIsOpen(false);
    } else if (
      !isFetchingSettings &&
      settingsIsError &&
      settingsError?.status !== 404
    ) {
      displayErrorToast(
        "Something went wrong while fetching settings. Please reload the page.",
      );
    } else if (
      config?.app_mode === "oss" &&
      settingsError?.status === 404 &&
      !config?.feature_flags?.hide_llm_settings
    ) {
      setSettingsModalIsOpen(true);
    }
  }, [
    pathname,
    isFetchingSettings,
    settingsIsError,
    settingsError,
    config?.app_mode,
    config?.feature_flags?.hide_llm_settings,
  ]);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isEmailVerified = settings?.email_verified !== false;

  const handleLogin = () => navigate("/login");
  const handleSignup = () => navigate("/login?signup=true");

  // Landing page navigation (atoms.dev style)
  if (isLandingPage) {
    return (
      <>
        <header
          aria-label={t(I18nKey.SIDEBAR$NAVIGATION_LABEL)}
          className={cn(
            "fixed top-0 left-0 right-0 z-50",
            "h-16 px-4 md:px-8 lg:px-12",
            "bg-transparent",
            "flex items-center justify-between",
          )}
        >
          {/* Left: Logo */}
          <div className="flex items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <OpenHandsLogoButton />
            </motion.div>
          </div>

          {/* Center/Right: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/pricing"
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              {t(I18nKey.ATOMS$NAV_PRICING)}
            </NavLink>
            <ResourcesDropdown t={t} />
          </nav>

          {/* Right: Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-300 hover:text-white hover:bg-transparent"
              onClick={handleLogin}
            >
              {t(I18nKey.ATOMS$NAV_LOGIN)}
            </Button>
            <Button
              size="sm"
              className="bg-white text-black hover:bg-neutral-200 font-medium px-4"
              onClick={handleSignup}
            >
              {t(I18nKey.ATOMS$NAV_SIGNUP)}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </header>

        {/* Mobile Menu - Landing */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <MobileMenuLanding
              t={t}
              onLogin={handleLogin}
              onSignup={handleSignup}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Authenticated navigation (app mode) - atoms.dev style
  return (
    <>
      <header
        aria-label={t(I18nKey.SIDEBAR$NAVIGATION_LABEL)}
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "h-16 px-4 md:px-8 lg:px-12",
          "bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-neutral-800/50",
          "flex items-center justify-between",
        )}
      >
        {/* Left: Logo */}
        <div className="flex items-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <OpenHandsLogoButton />
          </motion.div>
        </div>

        {/* Center: Navigation Actions (Desktop) */}
        <nav className="hidden md:flex items-center gap-4">
          {/* Pricing Link */}
          <NavLink
            to="/pricing"
            className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
          >
            {t(I18nKey.ATOMS$NAV_PRICING)}
          </NavLink>

          {/* Resources Dropdown */}
          <ResourcesDropdown t={t} />

          {/* Divider */}
          <div className="h-5 w-px bg-neutral-700/50" />

          {/* New Project Button - atoms.dev style */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <NavLink
              to="/"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-gradient-to-r from-indigo-600 to-purple-600",
                "hover:from-indigo-500 hover:to-purple-500",
                "text-white font-medium text-sm",
                "shadow-lg shadow-indigo-500/20",
                "transition-all duration-200",
                !isEmailVerified && "opacity-50 pointer-events-none",
              )}
              onClick={(e) => !isEmailVerified && e.preventDefault()}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>{t(I18nKey.CONVERSATION$START_NEW)}</span>
            </NavLink>
          </motion.div>

          {/* Conversations Button - atoms.dev style */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <button
              type="button"
              onClick={() =>
                isEmailVerified && setConversationPanelIsOpen((prev) => !prev)
              }
              disabled={!isEmailVerified}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-neutral-800/80 hover:bg-neutral-700/80",
                "text-neutral-300 hover:text-white",
                "font-medium text-sm",
                "border border-neutral-700/50 hover:border-neutral-600/50",
                "transition-all duration-200",
                conversationPanelIsOpen && "bg-neutral-700/80 text-white",
                !isEmailVerified && "opacity-50 cursor-not-allowed",
              )}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span>{t(I18nKey.SIDEBAR$CONVERSATIONS)}</span>
            </button>
          </motion.div>
        </nav>

        {/* Right: User Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <CreditsDisplay />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <UserActions
              user={
                user.data ? { avatar_url: user.data.avatar_url } : undefined
              }
              onLogout={logout}
              isLoading={user.isFetching}
            />
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white hover:bg-white/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </header>

      {/* Mobile Menu - Authenticated */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenuAuthed
            isEmailVerified={isEmailVerified}
            conversationPanelIsOpen={conversationPanelIsOpen}
            setConversationPanelIsOpen={setConversationPanelIsOpen}
            user={user}
            logout={logout}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Conversation Panel */}
      <ConversationPanelWrapper isOpen={conversationPanelIsOpen}>
        <ConversationPanel onClose={() => setConversationPanelIsOpen(false)} />
      </ConversationPanelWrapper>

      {/* Settings Modal */}
      {settingsModalIsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsModalIsOpen(false)}
        />
      )}
    </>
  );
}
