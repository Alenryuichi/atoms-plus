import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { cn } from "#/utils/utils";
import { Typography } from "#/ui/typography";
import { I18nKey } from "#/i18n/declaration";
import SettingsIcon from "#/icons/settings-gear.svg?react";
import CloseIcon from "#/icons/close.svg?react";
import { SettingsNavItem } from "#/constants/settings-nav";

interface SettingsNavigationProps {
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  navigationItems: SettingsNavItem[];
}

export function SettingsNavigation({
  isMobileMenuOpen,
  onCloseMobileMenu,
  navigationItems,
}: SettingsNavigationProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobileMenu}
        />
      )}
      {/* Navigation sidebar */}
      <nav
        data-testid="settings-navbar"
        className={cn(
          "flex flex-col gap-6 transition-transform duration-300 ease-in-out",
          // Mobile: full screen overlay
          "fixed inset-0 z-50 w-full bg-[#0a0a0a] p-4 transform md:transform-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: static sidebar with subtle border
          "md:relative md:translate-x-0 md:w-64 md:p-0 md:bg-transparent",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 ml-1 sm:ml-4.5">
            <SettingsIcon width={16} height={16} className="text-amber-500" />
            <Typography.H2 className="text-white">
              {t(I18nKey.SETTINGS$TITLE)}
            </Typography.H2>
          </div>
          {/* Close button - only visible on mobile */}
          <button
            type="button"
            onClick={onCloseMobileMenu}
            className="md:hidden p-0.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <CloseIcon width={32} height={32} />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {navigationItems.map(({ to, icon, text }) => (
            <NavLink
              end
              key={to}
              to={to}
              onClick={onCloseMobileMenu}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white",
                )
              }
            >
              {icon}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-sm whitespace-nowrap">
                  {t(text as I18nKey)}
                </span>
              </div>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
