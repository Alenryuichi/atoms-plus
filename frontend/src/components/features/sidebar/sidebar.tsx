import React from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useGitUser } from "#/hooks/query/use-git-user";
import { UserActions } from "./user-actions";
import { CreditsDisplay } from "./credits-display";
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
import { cn } from "#/utils/utils";

// Animation variants for sidebar items
const sidebarItemVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

// Stagger animation for sidebar navigation items
const navContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

export function Sidebar() {
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

  React.useEffect(() => {
    if (pathname === "/settings") {
      setSettingsModalIsOpen(false);
    } else if (
      !isFetchingSettings &&
      settingsIsError &&
      settingsError?.status !== 404
    ) {
      // We don't show toast errors for settings in the global error handler
      // because we have a special case for 404 errors
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

  return (
    <>
      <aside
        aria-label={t(I18nKey.SIDEBAR$NAVIGATION_LABEL)}
        className={cn(
          "h-[54px] p-3 md:p-0 md:h-[40px] md:h-auto flex flex-row md:flex-col gap-1 bg-base md:w-[75px] md:min-w-[75px] sm:pt-0 sm:px-2 md:pt-[14px] md:px-0",
          pathname === "/" && "md:pt-6.5 md:pb-3",
        )}
      >
        <nav className="flex flex-row md:flex-col items-center justify-between w-full h-auto md:w-auto md:h-full">
          <motion.div
            className="flex flex-row md:flex-col items-center gap-[26px]"
            variants={navContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={navItemVariants}
              className="flex items-center justify-center"
            >
              <motion.div
                variants={sidebarItemVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <OpenHandsLogoButton />
              </motion.div>
            </motion.div>
            <motion.div variants={navItemVariants}>
              <motion.div
                variants={sidebarItemVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <NewProjectButton
                  disabled={settings?.email_verified === false}
                />
              </motion.div>
            </motion.div>
            <motion.div variants={navItemVariants}>
              <motion.div
                variants={sidebarItemVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <ConversationPanelButton
                  isOpen={conversationPanelIsOpen}
                  onClick={() =>
                    settings?.email_verified === false
                      ? null
                      : setConversationPanelIsOpen((prev) => !prev)
                  }
                  disabled={settings?.email_verified === false}
                />
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex flex-row md:flex-col md:items-center gap-[18px]"
            variants={navContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={navItemVariants}>
              <CreditsDisplay />
            </motion.div>
            <motion.div variants={navItemVariants}>
              <motion.div
                variants={sidebarItemVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <UserActions
                  user={
                    user.data ? { avatar_url: user.data.avatar_url } : undefined
                  }
                  onLogout={logout}
                  isLoading={user.isFetching}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </nav>

        <ConversationPanelWrapper isOpen={conversationPanelIsOpen}>
          <ConversationPanel
            onClose={() => setConversationPanelIsOpen(false)}
          />
        </ConversationPanelWrapper>
      </aside>

      {settingsModalIsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsModalIsOpen(false)}
        />
      )}
    </>
  );
}
