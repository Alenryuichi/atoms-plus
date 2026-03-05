import React from "react";
import { useTranslation } from "react-i18next";
import { usePostHog } from "posthog-js/react";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { useSaveSettings } from "#/hooks/mutation/use-save-settings";
import { handleCaptureConsent } from "#/utils/handle-capture-consent";
import { BrandButton } from "../settings/brand-button";
import { StyledSwitchComponent } from "../settings/styled-switch-component";
import { I18nKey } from "#/i18n/declaration";

interface AnalyticsConsentFormModalProps {
  onClose: () => void;
}

export function AnalyticsConsentFormModal({
  onClose,
}: AnalyticsConsentFormModalProps) {
  const posthog = usePostHog();
  const { t } = useTranslation();
  const { mutate: saveUserSettings } = useSaveSettings();
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    saveUserSettings(
      { user_consents_to_analytics: analyticsEnabled },
      {
        onSuccess: () => {
          handleCaptureConsent(posthog, analyticsEnabled);
          onClose();
        },
      },
    );
  };

  const titleId = "analytics-modal-title";

  return (
    <ModalBackdrop>
      <form
        data-testid="user-capture-consent-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-2"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="bg-black/80 backdrop-blur-xl w-[420px] m-4 p-6 rounded-2xl flex flex-col gap-5 border border-amber-500/20 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <span
              id={titleId}
              className="text-xl leading-6 font-semibold -tracking-[0.2px] text-white"
            >
              {t(I18nKey.ANALYTICS$TITLE)}
            </span>
            <span className="text-sm text-neutral-400 leading-relaxed">
              {t(I18nKey.ANALYTICS$DESCRIPTION)}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          {/* Analytics Toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              hidden
              name="analytics"
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              aria-hidden="true"
            />
            <button
              type="button"
              role="switch"
              aria-checked={analyticsEnabled}
              aria-label={t(I18nKey.ANALYTICS$SEND_ANONYMOUS_DATA)}
              onClick={() => setAnalyticsEnabled((prev) => !prev)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-full"
            >
              <StyledSwitchComponent isToggled={analyticsEnabled} />
            </button>
            <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
              {t(I18nKey.ANALYTICS$SEND_ANONYMOUS_DATA)}
            </span>
          </label>

          {/* Submit Button */}
          <BrandButton
            testId="confirm-preferences"
            type="submit"
            variant="primary"
            className="w-full font-semibold"
          >
            {t(I18nKey.ANALYTICS$CONFIRM_PREFERENCES)}
          </BrandButton>
        </div>
      </form>
    </ModalBackdrop>
  );
}
