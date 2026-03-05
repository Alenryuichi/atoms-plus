import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { StyledSwitchComponent } from "./styled-switch-component";

interface SettingsSwitchProps {
  testId?: string;
  name?: string;
  onToggle?: (value: boolean) => void;
  defaultIsToggled?: boolean;
  isToggled?: boolean;
  isBeta?: boolean;
  isDisabled?: boolean;
}

export function SettingsSwitch({
  children,
  testId,
  name,
  onToggle,
  defaultIsToggled,
  isToggled: controlledIsToggled,
  isBeta,
  isDisabled,
}: React.PropsWithChildren<SettingsSwitchProps>) {
  const { t } = useTranslation();
  const [isToggled, setIsToggled] = React.useState(defaultIsToggled ?? false);

  const handleToggle = (value: boolean) => {
    if (isDisabled) return;
    setIsToggled(value);
    onToggle?.(value);
  };

  return (
    <label
      className={cn(
        "flex items-center gap-2 w-fit",
        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <input
        hidden
        data-testid={testId}
        name={name}
        type="checkbox"
        onChange={(e) => handleToggle(e.target.checked)}
        checked={controlledIsToggled ?? isToggled}
        disabled={isDisabled}
      />

      <StyledSwitchComponent isToggled={controlledIsToggled ?? isToggled} />

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-300">{children}</span>
        {isBeta && (
          <span className="text-[10px] leading-4 text-amber-900 font-semibold tracking-tight bg-gradient-to-r from-amber-500 to-amber-400 px-1.5 py-0.5 rounded-full">
            {t(I18nKey.BADGE$BETA)}
          </span>
        )}
      </div>
    </label>
  );
}
