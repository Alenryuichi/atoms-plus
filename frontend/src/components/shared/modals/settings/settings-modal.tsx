import { useTranslation } from "react-i18next";
import { useAIConfigOptions } from "#/hooks/query/use-ai-config-options";
import { I18nKey } from "#/i18n/declaration";
import { LoadingSpinner } from "../../loading-spinner";
import { ModalBackdrop } from "../modal-backdrop";
import { SettingsForm } from "./settings-form";
import { Settings } from "#/types/settings";
import { DEFAULT_SETTINGS } from "#/services/settings";
import { HelpLink } from "#/ui/help-link";

interface SettingsModalProps {
  settings?: Settings;
  onClose: () => void;
}

export function SettingsModal({ onClose, settings }: SettingsModalProps) {
  const aiConfigOptions = useAIConfigOptions();
  const { t } = useTranslation();
  const isMockMode = import.meta.env.VITE_MOCK_API === "true";

  return (
    <ModalBackdrop>
      <div
        data-testid="ai-config-modal"
        className="bg-black/80 backdrop-blur-xl min-w-full max-w-[475px] m-4 p-6 rounded-2xl flex flex-col gap-5 border border-amber-500/20 shadow-2xl shadow-black/50 api-configuration-modal"
      >
        {aiConfigOptions.error && (
          <p className="text-red-400 text-xs">{aiConfigOptions.error.message}</p>
        )}
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xl leading-6 font-semibold -tracking-[0.2px] text-white">
            {t(I18nKey.AI_SETTINGS$TITLE)}
          </span>
          {isMockMode && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors"
            >
              Skip (Dev Mode)
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <HelpLink
          testId="advanced-settings-link"
          text={`${t(I18nKey.SETTINGS$DESCRIPTION)}. ${t(I18nKey.SETTINGS$FOR_OTHER_OPTIONS)} ${t(I18nKey.COMMON$SEE)}`}
          linkText={t(I18nKey.COMMON$ADVANCED_SETTINGS)}
          href="/settings"
          suffix="."
          size="settings"
          linkColor="white"
          suffixClassName="text-white"
        />

        {aiConfigOptions.isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}
        {aiConfigOptions.data && (
          <SettingsForm
            settings={settings || DEFAULT_SETTINGS}
            models={aiConfigOptions.data?.models}
            onClose={onClose}
          />
        )}
      </div>
    </ModalBackdrop>
  );
}
