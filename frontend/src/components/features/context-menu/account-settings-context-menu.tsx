import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { ContextMenu } from "#/ui/context-menu";
import { ContextMenuListItem } from "./context-menu-list-item";
import { Divider } from "#/ui/divider";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { I18nKey } from "#/i18n/declaration";
import LogOutIcon from "#/icons/log-out.svg?react";
import DocumentIcon from "#/icons/document.svg?react";
import PlusIcon from "#/icons/plus.svg?react";
import { useSettingsNavItems } from "#/hooks/use-settings-nav-items";
import { useConfig } from "#/hooks/query/use-config";
import { useTracking } from "#/hooks/use-tracking";

interface AccountSettingsContextMenuProps {
  onLogout: () => void;
  onClose: () => void;
}

export function AccountSettingsContextMenu({
  onLogout,
  onClose,
}: AccountSettingsContextMenuProps) {
  const ref = useClickOutsideElement<HTMLUListElement>(onClose);
  const { t } = useTranslation();
  const { trackAddTeamMembersButtonClick } = useTracking();
  const { data: config } = useConfig();
  const isAddTeamMemberEnabled = useFeatureFlagEnabled(
    "exp_add_team_member_button",
  );
  // Get navigation items and filter out LLM settings if the feature flag is enabled
  const items = useSettingsNavItems();

  const isSaasMode = config?.app_mode === "saas";
  const showAddTeamMembers = isSaasMode && isAddTeamMemberEnabled;

  const navItems = items.map((item) => ({
    ...item,
    icon: React.cloneElement(item.icon, {
      width: 16,
      height: 16,
    } as React.SVGProps<SVGSVGElement>),
  }));
  const handleNavigationClick = () => onClose();

  const handleAddTeamMembers = () => {
    trackAddTeamMembersButtonClick();
    onClose();
  };

  // atoms.dev dark theme menu item styles
  const menuItemClasses =
    "flex items-center gap-3 px-3 py-2.5 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-700/50 transition-colors duration-150";

  return (
    <ContextMenu
      testId="account-settings-context-menu"
      ref={ref}
      alignment="right"
      position="bottom"
      className="mt-2 right-0 min-w-[220px] z-[9999]"
    >
      {showAddTeamMembers && (
        <ContextMenuListItem
          testId="add-team-members-button"
          onClick={handleAddTeamMembers}
          className={menuItemClasses}
        >
          <PlusIcon width={16} height={16} className="text-neutral-400" />
          <span className="text-sm font-medium">
            {t(I18nKey.SETTINGS$NAV_ADD_TEAM_MEMBERS)}
          </span>
        </ContextMenuListItem>
      )}
      {navItems.map(({ to, text, icon }) => (
        <Link key={to} to={to} className="no-underline">
          <ContextMenuListItem
            onClick={handleNavigationClick}
            className={menuItemClasses}
          >
            <span className="text-neutral-400">{icon}</span>
            <span className="text-sm font-medium">{t(text)}</span>
          </ContextMenuListItem>
        </Link>
      ))}

      <Divider color="dark" className="my-1" />

      <a
        href="https://docs.openhands.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
      >
        <ContextMenuListItem onClick={onClose} className={menuItemClasses}>
          <DocumentIcon width={16} height={16} className="text-neutral-400" />
          <span className="text-sm font-medium">{t(I18nKey.SIDEBAR$DOCS)}</span>
        </ContextMenuListItem>
      </a>

      <ContextMenuListItem
        onClick={onLogout}
        className={`${menuItemClasses} text-red-400 hover:text-red-300 hover:bg-red-500/10`}
      >
        <LogOutIcon width={16} height={16} />
        <span className="text-sm font-medium">
          {t(I18nKey.ACCOUNT_SETTINGS$LOGOUT)}
        </span>
      </ContextMenuListItem>
    </ContextMenu>
  );
}
