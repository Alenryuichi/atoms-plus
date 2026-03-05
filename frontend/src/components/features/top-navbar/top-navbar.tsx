import React from "react";
import { useLocation, NavLink, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Plus,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
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
import { LanguageSwitcher } from "#/components/shared/language-switcher";
import { useConversationStore } from "#/stores/conversation-store";
import { getPreviewPanelRef } from "#/routes/preview-tab";

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

// Desktop Navigation Actions Component
interface NavActionsDesktopProps {
  isConversationPage: boolean;
  isEmailVerified: boolean;
  conversationPanelIsOpen: boolean;
  setConversationPanelIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  t: ReturnType<typeof useTranslation>["t"];
}

function NavActionsDesktop({
  isConversationPage,
  isEmailVerified,
  conversationPanelIsOpen,
  setConversationPanelIsOpen,
  t,
}: NavActionsDesktopProps) {
  const {
    previewViewMode,
    setPreviewViewMode,
    panelLeftWidth,
    panelIsDragging,
  } = useConversationStore();

  const handlePreviewRefresh = () => {
    const previewRef = getPreviewPanelRef();
    if (previewRef) {
      previewRef.refresh();
    }
  };

  // Chat page: Icon buttons + Preview controls aligned with split panels
  // CRITICAL: Must use EXACTLY the same flex layout as ConversationMain to achieve pixel-perfect alignment
  // ConversationMain uses: width% + flexGrow:1 + flexShrink:1
  if (isConversationPage) {
    return (
      <nav
        className="absolute hidden md:flex items-center gap-3 z-[5]"
        style={{
          // Match ConversationMain's p-3 for vertical centering
          top: "12px",
          bottom: "12px",
          // Match ConversationMain's p-3 for horizontal padding
          left: "12px",
          right: "12px",
        }}
      >
        {/* Left half: Chat controls - EXACT same flex properties as Chat panel below */}
        {/* KEY: ConversationMain uses flex-1 (flex: 1 1 0%) which means flex-basis: 0 */}
        {/* We must use flexBasis: 0 + flexGrow ratio to match the exact same space distribution */}
        <div
          className="flex items-center justify-end gap-2 h-full"
          style={{
            // Match ConversationMain's flex-1 behavior: basis 0, grow proportionally
            flexGrow: panelLeftWidth,
            flexShrink: 1,
            flexBasis: 0,
            transitionProperty: panelIsDragging ? "none" : "all",
            transitionDuration: "0.3s",
            transitionTimingFunction: "ease-in-out",
          }}
        >
          {/* New Project - Icon only */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NavLink
              to="/"
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl",
                "bg-gradient-to-br from-amber-500 to-amber-600",
                "text-black",
                "shadow-lg shadow-amber-500/25",
                "transition-all duration-200",
                "hover:shadow-amber-500/40 hover:from-amber-400 hover:to-amber-500",
                !isEmailVerified && "opacity-50 pointer-events-none",
              )}
              onClick={(e) => !isEmailVerified && e.preventDefault()}
              title={t(I18nKey.CONVERSATION$START_NEW)}
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </NavLink>
          </motion.div>

          {/* Conversations - Icon only */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              type="button"
              onClick={() =>
                isEmailVerified && setConversationPanelIsOpen((prev) => !prev)
              }
              disabled={!isEmailVerified}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl",
                "bg-black/40 backdrop-blur-sm",
                "text-neutral-400 hover:text-white",
                "border border-white/10 hover:border-amber-500/30",
                "transition-all duration-200",
                conversationPanelIsOpen &&
                  "bg-amber-500/20 text-amber-400 border-amber-500/30",
                !isEmailVerified && "opacity-50 cursor-not-allowed",
              )}
              title={t(I18nKey.SIDEBAR$CONVERSATIONS)}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </motion.div>
        </div>

        {/* Center Divider - matches ResizeHandle width (w-2 = 8px) in ConversationMain */}
        <div className="w-2 flex-shrink-0 flex items-center justify-center">
          <div className="h-6 w-px bg-white/20" />
        </div>

        {/* Right half: Preview controls - EXACT same flex properties as Preview panel below */}
        {/* KEY: ConversationMain uses flex-1 (flex: 1 1 0%) which means flex-basis: 0 */}
        <div
          className="flex items-center justify-start gap-1.5 h-full"
          style={{
            // Match ConversationMain's flex-1 behavior: basis 0, grow proportionally
            flexGrow: 100 - panelLeftWidth,
            flexShrink: 1,
            flexBasis: 0,
            transitionProperty: panelIsDragging ? "none" : "all",
            transitionDuration: "0.3s",
            transitionTimingFunction: "ease-in-out",
          }}
        >
          {/* View Mode Toggle */}
          <div className="flex bg-black/40 backdrop-blur-sm rounded-xl p-1 border border-white/10">
            {(["split", "editor", "preview"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPreviewViewMode(mode)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition-all font-medium",
                  previewViewMode === mode
                    ? "bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/5",
                )}
              >
                {
                  {
                    split: t(I18nKey.COMMON$SPLIT),
                    editor: t(I18nKey.COMMON$CODE),
                    preview: t(I18nKey.COMMON$PREVIEW),
                  }[mode]
                }
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <motion.button
            type="button"
            onClick={handlePreviewRefresh}
            whileHover={{ scale: 1.05, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-xl",
              "bg-black/40 backdrop-blur-sm",
              "text-neutral-400 hover:text-amber-400",
              "border border-white/10 hover:border-amber-500/30",
              "transition-all duration-200",
            )}
            title={t(I18nKey.BUTTON$REFRESH)}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </nav>
    );
  }

  // Non-chat pages (homepage): Only show Pricing and Resources - absolutely centered in header
  return (
    <nav className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-4 z-[5]">
      {/* Pricing Link */}
      <NavLink
        to="/pricing"
        className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
      >
        {t(I18nKey.ATOMS$NAV_PRICING)}
      </NavLink>

      {/* Resources Dropdown */}
      <ResourcesDropdown t={t} />
    </nav>
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
  isConversationPage?: boolean;
}

function MobileMenuAuthed({
  isEmailVerified,
  conversationPanelIsOpen,
  setConversationPanelIsOpen,
  user,
  logout,
  t,
  isConversationPage = false,
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

        {/* Divider - hidden on conversation page */}
        {!isConversationPage && (
          <div className="border-t border-neutral-800/50 pt-3 mt-1" />
        )}

        {/* Pricing Link - Mobile - hidden on conversation page */}
        {!isConversationPage && (
          <NavLink
            to="/pricing"
            className="flex items-center justify-center py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
          >
            {t(I18nKey.ATOMS$NAV_PRICING)}
          </NavLink>
        )}

        {/* Resources Links - Mobile - hidden on conversation page */}
        {!isConversationPage && (
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
        )}

        {/* Language Switcher */}
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-sm text-neutral-400">
            {t(I18nKey.SETTINGS$LANGUAGE)}
          </span>
          <LanguageSwitcher variant="full" />
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
        {/* Language Switcher */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm text-neutral-400">
            {t(I18nKey.SETTINGS$LANGUAGE)}
          </span>
          <LanguageSwitcher variant="full" />
        </div>
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

  // Determine if we're on a conversation page (hide Pricing/Resources)
  const isConversationPage = pathname.startsWith("/conversations/");

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
            "flex items-center",
          )}
        >
          {/* Left: Logo */}
          <div className="flex items-center flex-shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <OpenHandsLogoButton />
            </motion.div>
          </div>

          {/* Center: Navigation Links (Desktop) - absolute centered */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <NavLink
              to="/pricing"
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              {t(I18nKey.ATOMS$NAV_PRICING)}
            </NavLink>
            <ResourcesDropdown t={t} />
          </nav>

          {/* Right: Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <LanguageSwitcher />
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
            className="md:hidden text-white hover:bg-white/10 ml-auto"
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
        className="fixed top-0 left-0 right-0 z-50 h-16"
      >
        {/* Background layer */}
        <div className="absolute inset-0 bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-neutral-800/50" />

        {/* Left: Logo - absolutely positioned */}
        <div className="absolute left-4 md:left-8 lg:left-12 top-1/2 -translate-y-1/2 z-10">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <OpenHandsLogoButton />
          </motion.div>
        </div>

        {/* Center: Navigation Actions - uses same p-3 gap-3 as ConversationMain for alignment */}
        <NavActionsDesktop
          isConversationPage={isConversationPage}
          isEmailVerified={isEmailVerified}
          conversationPanelIsOpen={conversationPanelIsOpen}
          setConversationPanelIsOpen={setConversationPanelIsOpen}
          t={t}
        />

        {/* Right: User Actions - absolutely positioned */}
        <div className="absolute right-4 md:right-8 lg:right-12 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center gap-4">
          <LanguageSwitcher />
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
            isConversationPage={isConversationPage}
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
