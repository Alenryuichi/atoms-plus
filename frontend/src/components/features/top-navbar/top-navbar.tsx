import React from "react";
import { useLocation, NavLink, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconMenu2,
  IconX,
  IconChevronDown,
  IconPlus,
  IconMessageCircle,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
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
import { ConversationTabs } from "../conversation/conversation-tabs/conversation-tabs";

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
        <IconChevronDown
          size={16}
          stroke={1.5}
          className={cn(
            "transition-transform duration-200",
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
  isHomePage: boolean;
  isEmailVerified: boolean;
  conversationPanelIsOpen: boolean;
  setConversationPanelIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  t: ReturnType<typeof useTranslation>["t"];
  user: ReturnType<typeof useGitUser>;
  logout: () => void;
}

function NavActionsDesktop({
  isConversationPage,
  isHomePage,
  isEmailVerified,
  conversationPanelIsOpen,
  setConversationPanelIsOpen,
  t,
  user,
  logout,
}: NavActionsDesktopProps) {
  const {
    panelLeftWidth,
    panelIsDragging,
    isChatPanelCollapsed,
    toggleChatPanelCollapsed,
  } = useConversationStore();

  // Effective left width for layout - when collapsed, use minimal width
  const effectiveLeftWidth = isChatPanelCollapsed ? 0 : panelLeftWidth;

  // Chat page: Icon buttons + Preview controls aligned with split panels
  // CRITICAL: Must use EXACTLY the same flex layout as ConversationMain to achieve pixel-perfect alignment
  // ConversationMain uses: gap-2 p-2 pt-0 + flexGrow with panel widths
  // Layout: [Logo]   [<<] [对话] | [Tabs]   [Avatar]
  // The divider "|" aligns with ResizeHandle in ConversationMain
  if (isConversationPage) {
    return (
      <nav
        className="absolute hidden md:flex items-center gap-2 z-[5]"
        style={{
          top: "8px",
          bottom: "8px",
          left: "8px",
          right: "8px",
        }}
      >
        {/* Left section: Collapse Button + Conversation Toggle - aligned to right edge (near divider) */}
        <div
          className="flex items-center justify-end h-full gap-1"
          style={{
            flexGrow: effectiveLeftWidth,
            flexShrink: 1,
            flexBasis: 0,
            transitionProperty: panelIsDragging ? "none" : "all",
            transitionDuration: "0.3s",
            transitionTimingFunction: "ease-in-out",
          }}
        >
          {/* Collapse/Expand Chat Panel Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              type="button"
              onClick={toggleChatPanelCollapsed}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg",
                "text-white/40 hover:text-white/90",
                "transition-all duration-200",
                isChatPanelCollapsed && "text-white bg-white/10",
              )}
              title={isChatPanelCollapsed ? "展开对话面板" : "收起对话面板"}
            >
              {isChatPanelCollapsed ? (
                <IconChevronsRight size={18} stroke={1.5} />
              ) : (
                <IconChevronsLeft size={18} stroke={1.5} />
              )}
            </button>
          </motion.div>

          {/* Conversation List Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              type="button"
              onClick={() =>
                isEmailVerified && setConversationPanelIsOpen((prev) => !prev)
              }
              disabled={!isEmailVerified}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg",
                "text-white/40 hover:text-white/90",
                "transition-all duration-200",
                conversationPanelIsOpen && "text-white bg-white/10",
                !isEmailVerified && "opacity-50 cursor-not-allowed",
              )}
              title={t(I18nKey.SIDEBAR$CONVERSATIONS)}
            >
              <IconMessageCircle size={18} stroke={1.5} />
            </button>
          </motion.div>
        </div>

        {/* Center Divider - matches ResizeHandle width (8px gap) */}
        <div className="flex-shrink-0 w-2 flex items-center justify-center">
          <div className="h-6 w-px bg-white/10" />
        </div>

        {/* Right section: Tab Switcher + User Avatar - Tabs aligned to left (near divider), Avatar on far right */}
        <div
          className="flex items-center justify-start h-full"
          style={{
            flexGrow: 100 - effectiveLeftWidth,
            flexShrink: 1,
            flexBasis: 0,
            transitionProperty: panelIsDragging ? "none" : "all",
            transitionDuration: "0.3s",
            transitionTimingFunction: "ease-in-out",
          }}
        >
          {/* Tab switcher: Preview, Changes, Terminal, etc. - aligned to left (near divider) */}
          <ConversationTabs />

          {/* User Avatar on the far right - ml-auto pushes it to the end */}
          <motion.div
            className="ml-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserActions
              user={
                user.data
                  ? {
                      avatar_url: user.data.avatar_url,
                      email: user.data.email,
                      name: user.data.name,
                    }
                  : undefined
              }
              onLogout={logout}
              isLoading={user.isFetching}
              className="!p-0"
            />
          </motion.div>
        </div>
      </nav>
    );
  }

  // Non-chat pages: Full text buttons - centered in viewport
  // Homepage: Only show Pricing and Resources (no divider, no new conversation, no conversations button)
  // Other pages: Show all items
  return (
    <nav
      className="absolute hidden md:flex items-center gap-4 z-[5]"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Pricing Link */}
      <NavLink
        to="/pricing"
        className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
      >
        {t(I18nKey.ATOMS$NAV_PRICING)}
      </NavLink>

      {/* Resources Dropdown */}
      <ResourcesDropdown t={t} />

      {/* Non-homepage: Show divider, new conversation, and conversations button */}
      {!isHomePage && (
        <>
          {/* Divider */}
          <div className="h-5 w-px bg-neutral-700/50" />

          {/* New Project Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <NavLink
              to="/"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-[var(--atoms-accent-primary)] hover:bg-[var(--atoms-accent-hover)]",
                "text-white font-medium text-sm",
                "shadow-lg shadow-amber-500/20",
                "transition-all duration-200",
                !isEmailVerified && "opacity-50 pointer-events-none",
              )}
              onClick={(e) => !isEmailVerified && e.preventDefault()}
            >
              <IconPlus size={16} stroke={1.5} />
              <span>{t(I18nKey.CONVERSATION$START_NEW)}</span>
            </NavLink>
          </motion.div>

          {/* Conversations Button */}
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
              <IconMessageCircle size={16} stroke={1.5} />
              <span>{t(I18nKey.SIDEBAR$CONVERSATIONS)}</span>
            </button>
          </motion.div>
        </>
      )}
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
                user.data
                  ? {
                      avatar_url: user.data.avatar_url,
                      email: user.data.email,
                      name: user.data.name,
                    }
                  : undefined
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

  // Determine if we're on the home page (authenticated or not)
  const isHomePage = pathname === "/";

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
            // CSS Grid: 3 equal columns for perfect centering
            "grid grid-cols-3 items-center",
          )}
        >
          {/* Left: Logo */}
          <div className="flex items-center justify-start">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <OpenHandsLogoButton />
            </motion.div>
          </div>

          {/* Center: Navigation Links (Desktop) - centered in middle column */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            <NavLink
              to="/pricing"
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              {t(I18nKey.ATOMS$NAV_PRICING)}
            </NavLink>
            <ResourcesDropdown t={t} />
          </nav>

          {/* Right: Auth Buttons (Desktop) + Mobile Menu Button */}
          <div className="flex items-center justify-end gap-3">
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
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
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <IconX size={20} stroke={1.5} />
              ) : (
                <IconMenu2 size={20} stroke={1.5} />
              )}
            </Button>
          </div>
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
          isHomePage={isHomePage}
          isEmailVerified={isEmailVerified}
          conversationPanelIsOpen={conversationPanelIsOpen}
          setConversationPanelIsOpen={setConversationPanelIsOpen}
          t={t}
          user={user}
          logout={logout}
        />

        {/* Right: User Actions - absolutely positioned (hidden on conversation pages, handled by NavActionsDesktop) */}
        <div
          className={cn(
            "absolute right-4 md:right-8 lg:right-12 top-1/2 -translate-y-1/2 z-10 items-center gap-3",
            isConversationPage ? "hidden" : "hidden md:flex",
          )}
        >
          {/* Conversations Icon Button (Homepage only) - pure icon style */}
          {isHomePage && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                type="button"
                onClick={() =>
                  isEmailVerified && setConversationPanelIsOpen((prev) => !prev)
                }
                disabled={!isEmailVerified}
                aria-label={t(I18nKey.SIDEBAR$CONVERSATIONS)}
                className={cn(
                  "p-2 rounded-md",
                  "text-neutral-300 hover:text-white hover:bg-white/10",
                  "transition-all duration-200",
                  conversationPanelIsOpen && "text-white bg-white/10",
                  !isEmailVerified && "opacity-50 cursor-not-allowed",
                )}
              >
                <IconMessageCircle size={16} stroke={1.5} />
              </button>
            </motion.div>
          )}
          <LanguageSwitcher />
          <CreditsDisplay />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <UserActions
              user={
                user.data
                  ? {
                      avatar_url: user.data.avatar_url,
                      email: user.data.email,
                      name: user.data.name,
                    }
                  : undefined
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
            <IconX size={20} stroke={1.5} />
          ) : (
            <IconMenu2 size={20} stroke={1.5} />
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
