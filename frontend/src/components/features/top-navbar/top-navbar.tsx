import React from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useGitUser } from "#/hooks/query/use-git-user";
import { UserActions } from "../sidebar/user-actions";
import { CreditsDisplay } from "../sidebar/credits-display";
import { OpenHandsLogoButton } from "#/components/shared/buttons/openhands-logo-button";
import { NewProjectButton } from "#/components/shared/buttons/new-project-button";
import { ConversationPanelButton } from "#/components/shared/buttons/conversation-panel-button";
import { SettingsModal } from "#/components/shared/modals/settings/settings-modal";
import { useSettings } from "#/hooks/query/use-settings";
import { ConversationPanel } from "../conversation-panel/conversation-panel";
import { ConversationPanelWrapper } from "../conversation-panel/conversation-panel-wrapper";
import { useLogout } from "#/hooks/mutation/use-logout";
import { useConfig } from "#/hooks/query/use-config";
import { displayErrorToast } from "#/utils/custom-toast-handlers";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";

// Mobile Menu Component - defined before TopNavbar to avoid use-before-define error
interface MobileMenuProps {
  isEmailVerified: boolean;
  conversationPanelIsOpen: boolean;
  setConversationPanelIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: ReturnType<typeof useGitUser>;
  logout: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}

function MobileMenu({
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
        "fixed top-14 left-0 right-0 z-40",
        "bg-card/95 backdrop-blur-md border-b border-border/40",
        "p-4 md:hidden",
      )}
    >
      <nav className="flex flex-col gap-3">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t(I18nKey.CONVERSATION$START_NEW)}
          </span>
          <NewProjectButton disabled={!isEmailVerified} />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t(I18nKey.SIDEBAR$CONVERSATIONS)}
          </span>
          <ConversationPanelButton
            isOpen={conversationPanelIsOpen}
            onClick={() =>
              isEmailVerified && setConversationPanelIsOpen((prev) => !prev)
            }
            disabled={!isEmailVerified}
          />
        </div>
        <div className="border-t border-border/40 pt-3 mt-2">
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

export function TopNavbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const user = useGitUser();
  const { data: config } = useConfig();
  const {
    data: settings,
    error: settingsError,
    isError: settingsIsError,
    isFetching: isFetchingSettings,
  } = useSettings();
  const { mutate: logout } = useLogout();

  const [settingsModalIsOpen, setSettingsModalIsOpen] = React.useState(false);
  const [conversationPanelIsOpen, setConversationPanelIsOpen] =
    React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  return (
    <>
      <header
        aria-label={t(I18nKey.SIDEBAR$NAVIGATION_LABEL)}
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "h-14 px-4 md:px-6",
          "bg-card/80 backdrop-blur-md border-b border-border/40",
          "flex items-center justify-between",
        )}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <OpenHandsLogoButton />
          </motion.div>
        </div>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              disabled={!isEmailVerified}
              asChild
            >
              <NewProjectButton disabled={!isEmailVerified} />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ConversationPanelButton
              isOpen={conversationPanelIsOpen}
              onClick={() =>
                isEmailVerified && setConversationPanelIsOpen((prev) => !prev)
              }
              disabled={!isEmailVerified}
            />
          </motion.div>
        </nav>

        {/* Right: User Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
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
          className="md:hidden"
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu
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
