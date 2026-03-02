import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { AtomsPlusLogo } from "#/assets/branding/atoms-plus-logo";
import { I18nKey } from "#/i18n/declaration";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";

export function AtomsPlusLogoButton() {
  const { t } = useTranslation();

  const tooltipText = t(I18nKey.BRANDING$ATOMS_PLUS);
  const ariaLabel = t(I18nKey.BRANDING$ATOMS_PLUS_LOGO);

  return (
    <StyledTooltip content={tooltipText}>
      <NavLink to="/" aria-label={ariaLabel}>
        <AtomsPlusLogo width={46} height={46} />
      </NavLink>
    </StyledTooltip>
  );
}

// Keep old export name for backward compatibility
export const OpenHandsLogoButton = AtomsPlusLogoButton;
