import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import AtomsPlusIconLight from "#/assets/branding/atoms-plus/atoms-plus-icon-light.png";
import AtomsPlusLockupLight from "#/assets/branding/atoms-plus/atoms-plus-lockup-light.png";
import { I18nKey } from "#/i18n/declaration";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";
import { cn } from "#/lib/utils";

interface AtomsPlusLogoButtonProps {
  compact?: boolean;
  className?: string;
}

export function AtomsPlusLogoButton({
  compact = false,
  className,
}: AtomsPlusLogoButtonProps) {
  const { t } = useTranslation();

  const tooltipText = t(I18nKey.BRANDING$ATOMS_PLUS);
  const ariaLabel = t(I18nKey.BRANDING$ATOMS_PLUS_LOGO);

  return (
    <StyledTooltip content={tooltipText}>
      <NavLink
        to="/"
        aria-label={ariaLabel}
        className={cn("inline-flex items-center", className)}
      >
        {compact ? (
          <img
            src={AtomsPlusIconLight}
            width={36}
            height={36}
            alt={ariaLabel}
            className="block h-9 w-9 object-contain"
          />
        ) : (
          <>
            <img
              src={AtomsPlusIconLight}
              width={36}
              height={36}
              alt={ariaLabel}
              className="block h-9 w-9 object-contain md:hidden"
            />
            <img
              src={AtomsPlusLockupLight}
              width={132}
              height={32}
              alt={ariaLabel}
              className="hidden h-8 w-auto object-contain md:block"
            />
          </>
        )}
      </NavLink>
    </StyledTooltip>
  );
}

// Keep old export name for backward compatibility
export const OpenHandsLogoButton = AtomsPlusLogoButton;
