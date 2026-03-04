import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { mapProvider } from "#/utils/map-provider";
import {
  VERIFIED_MODELS,
  VERIFIED_PROVIDERS,
  VERIFIED_OPENHANDS_MODELS,
} from "#/utils/verified-models";
import { extractModelAndProvider } from "#/utils/extract-model-and-provider";
import { cn } from "#/utils/utils";
import { HelpLink } from "#/ui/help-link";
import { PRODUCT_URL } from "#/utils/constants";
import { Combobox, ComboboxGroup } from "#/components/ui/combobox";

interface ModelSelectorProps {
  isDisabled?: boolean;
  models: Record<string, { separator: string; models: string[] }>;
  currentModel?: string;
  onChange?: (provider: string | null, model: string | null) => void;
  onDefaultValuesChanged?: (
    provider: string | null,
    model: string | null,
  ) => void;
  wrapperClassName?: string;
  labelClassName?: string;
}

export function ModelSelector({
  isDisabled,
  models,
  currentModel,
  onChange,
  onDefaultValuesChanged,
  wrapperClassName,
  labelClassName,
}: ModelSelectorProps) {
  const [, setLitellmId] = React.useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = React.useState<string | null>(
    null,
  );
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);

  // Get the appropriate verified models array based on the selected provider
  const getVerifiedModels = () => {
    if (selectedProvider === "openhands") {
      return VERIFIED_OPENHANDS_MODELS;
    }
    return VERIFIED_MODELS;
  };

  React.useEffect(() => {
    if (currentModel) {
      // runs when resetting to defaults
      const { provider, model } = extractModelAndProvider(currentModel);

      setLitellmId(currentModel);
      setSelectedProvider(provider);
      setSelectedModel(model);
      onDefaultValuesChanged?.(provider, model);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDefaultValuesChanged is intentionally excluded to prevent infinite loops
  }, [currentModel]);

  const handleChangeProvider = (provider: string | null) => {
    if (!provider) {
      setSelectedProvider(null);
      setLitellmId(null);
      return;
    }
    setSelectedProvider(provider);
    setSelectedModel(null);

    const separator = models[provider]?.separator || "";
    setLitellmId(provider + separator);
    onChange?.(provider, null);
  };

  const handleChangeModel = (model: string | null) => {
    if (!model) return;
    const separator = models[selectedProvider || ""]?.separator || "";
    let fullModel = selectedProvider + separator + model;
    if (selectedProvider === "openai") {
      // LiteLLM lists OpenAI models without the openai/ prefix
      fullModel = model;
    }
    setLitellmId(fullModel);
    setSelectedModel(model);
    onChange?.(selectedProvider, model);
  };

  const { t } = useTranslation();

  // Build provider groups
  const providerGroups: ComboboxGroup[] = React.useMemo(() => {
    const groups: ComboboxGroup[] = [];

    // Verified providers
    const verifiedProviders = VERIFIED_PROVIDERS.filter(
      (provider) => models[provider],
    ).map((provider) => ({
      value: provider,
      label: mapProvider(provider),
    }));

    if (verifiedProviders.length > 0) {
      groups.push({
        label: t(I18nKey.MODEL_SELECTOR$VERIFIED),
        items: verifiedProviders,
      });
    }

    // Other providers
    const otherProviders = Object.keys(models)
      .filter((provider) => !VERIFIED_PROVIDERS.includes(provider))
      .map((provider) => ({
        value: provider,
        label: mapProvider(provider),
      }));

    if (otherProviders.length > 0) {
      groups.push({
        label: t(I18nKey.MODEL_SELECTOR$OTHERS),
        items: otherProviders,
      });
    }

    return groups;
  }, [models, t]);

  // Build model groups
  const modelGroups: ComboboxGroup[] = React.useMemo(() => {
    const groups: ComboboxGroup[] = [];
    const availableModels = models[selectedProvider || ""]?.models || [];
    const verifiedModelsList = getVerifiedModels();

    // Verified models
    const verifiedModels = verifiedModelsList
      .filter((model) => availableModels.includes(model))
      .map((model) => ({
        value: model,
        label: model,
      }));

    if (verifiedModels.length > 0) {
      groups.push({
        label: t(I18nKey.MODEL_SELECTOR$VERIFIED),
        items: verifiedModels,
      });
    }

    // Other models
    const otherModels = availableModels
      .filter((model) => !verifiedModelsList.includes(model))
      .map((model) => ({
        value: model,
        label: model,
      }));

    if (otherModels.length > 0) {
      groups.push({
        label: t(I18nKey.MODEL_SELECTOR$OTHERS),
        items: otherModels,
      });
    }

    return groups;
  }, [models, selectedProvider, t]);

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-[full] max-w-[680px] justify-between gap-4 md:gap-[46px]",
        wrapperClassName,
      )}
    >
      <fieldset className="flex flex-col gap-2.5 w-full">
        <label className={cn("text-sm", labelClassName)}>
          {t(I18nKey.LLM$PROVIDER)}
        </label>
        <Combobox
          data-testid="llm-provider-input"
          name="llm-provider-input"
          disabled={isDisabled}
          aria-label={t(I18nKey.LLM$PROVIDER)}
          placeholder={t(I18nKey.LLM$SELECT_PROVIDER_PLACEHOLDER)}
          isClearable={false}
          required
          onValueChange={handleChangeProvider}
          onInputChange={(value) => !value && handleChangeProvider(null)}
          value={selectedProvider ?? undefined}
          groups={providerGroups}
          triggerClassName="bg-tertiary border border-[#717888] h-10 w-full rounded-sm p-2"
          popoverClassName="bg-tertiary rounded-xl border border-[#717888]"
        />
      </fieldset>

      {selectedProvider === "openhands" && (
        <HelpLink
          testId="openhands-account-help"
          text={t(I18nKey.SETTINGS$NEED_OPENHANDS_ACCOUNT)}
          linkText={t(I18nKey.SETTINGS$CLICK_HERE)}
          href={PRODUCT_URL.PRODUCTION}
          size="settings"
          linkColor="white"
        />
      )}

      <fieldset className="flex flex-col gap-2.5 w-full">
        <label className={cn("text-sm", labelClassName)}>
          {t(I18nKey.LLM$MODEL)}
        </label>
        <Combobox
          data-testid="llm-model-input"
          name="llm-model-input"
          aria-label={t(I18nKey.LLM$MODEL)}
          placeholder={t(I18nKey.LLM$SELECT_MODEL_PLACEHOLDER)}
          isClearable={false}
          required
          onValueChange={handleChangeModel}
          disabled={isDisabled || !selectedProvider}
          value={selectedModel ?? undefined}
          groups={modelGroups}
          triggerClassName="bg-tertiary border border-[#717888] h-10 w-full rounded-sm p-2"
          popoverClassName="bg-tertiary rounded-xl border border-[#717888]"
        />
      </fieldset>
    </div>
  );
}
