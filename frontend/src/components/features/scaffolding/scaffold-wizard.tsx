/* eslint-disable i18next/no-literal-string */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { ProjectTypeStep } from "./steps/project-type-step";
import { ConfigurationStep } from "./steps/configuration-step";
import { GenerationStep } from "./steps/generation-step";
import { useScaffoldingPresets } from "#/hooks/query/use-scaffolding-presets";
import { useScaffoldingTemplates } from "#/hooks/query/use-scaffolding-templates";
import { useLaunchScaffold } from "#/hooks/mutation/use-launch-scaffold";
import { ScaffoldingConfig, ScaffoldingLaunchResult } from "./types";

interface ScaffoldWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialPresetId?: string;
  initialTemplateId?: string;
  initialConfig?: Partial<ScaffoldingConfig>;
}

export type WizardStep = "project-type" | "configuration" | "generation";

const STEP_COPY: Record<WizardStep, { label: string; description: string }> = {
  "project-type": {
    label: "Choose template",
    description: "Pick a starter framework to begin with.",
  },
  configuration: {
    label: "Configure project",
    description: "Adjust the defaults before your workspace is created.",
  },
  generation: {
    label: "Prepare workspace",
    description: "Generating starter files and opening your conversation.",
  },
};

const getStepIndex = (step: WizardStep): number => {
  if (step === "project-type") return 0;
  if (step === "configuration") return 1;
  return 2;
};

export function ScaffoldWizard({
  isOpen,
  onClose,
  initialPresetId,
  initialTemplateId,
  initialConfig,
}: ScaffoldWizardProps) {
  const navigate = useNavigate();
  const modalBodyRef = React.useRef<HTMLDivElement>(null);
  const { data: templatesData, isLoading: isTemplatesLoading } =
    useScaffoldingTemplates();
  const { data: presetsData } = useScaffoldingPresets();
  const launchScaffold = useLaunchScaffold();
  const templates = templatesData?.templates ?? [];
  const presets = presetsData?.presets ?? [];
  const resolvedPreset = useMemo(
    () => presets.find((preset) => preset.id === initialPresetId),
    [initialPresetId, presets],
  );
  const resolvedTemplate = useMemo(() => {
    const templateId = initialTemplateId ?? resolvedPreset?.templateId;
    if (templateId) {
      return templates.find((template) => template.id === templateId);
    }

    if (initialConfig?.projectType) {
      return templates.find(
        (template) => template.projectType === initialConfig.projectType,
      );
    }

    return undefined;
  }, [
    initialConfig?.projectType,
    initialTemplateId,
    resolvedPreset,
    templates,
  ]);

  const [currentStep, setCurrentStep] = useState<WizardStep>("project-type");
  const [config, setConfig] = useState<Partial<ScaffoldingConfig>>({});
  const [generationResult, setGenerationResult] =
    useState<ScaffoldingLaunchResult | null>(null);
  const selectedTemplate =
    templates.find((template) => template.id === config.templateId) ??
    resolvedTemplate;
  const selectedPreset =
    presets.find((preset) => preset.id === config.presetId) ?? resolvedPreset;

  useEffect(() => {
    if (isOpen) {
      if (resolvedTemplate) {
        setCurrentStep("configuration");
        setConfig({
          projectType: resolvedTemplate.projectType,
          templateId: resolvedTemplate.id,
          presetId: resolvedPreset?.id,
          uiLibrary:
            initialConfig?.uiLibrary ??
            resolvedPreset?.defaultConfig?.uiLibrary ??
            resolvedTemplate.supportedUiLibraries[0] ??
            "tailwind",
          features: initialConfig?.features ??
            resolvedPreset?.defaultConfig?.features ?? ["typescript"],
          description:
            initialConfig?.description ??
            resolvedPreset?.defaultConfig?.description ??
            resolvedTemplate.description,
          packageManager:
            initialConfig?.packageManager ??
            resolvedPreset?.defaultConfig?.packageManager ??
            "npm",
        });
      } else {
        setCurrentStep("project-type");
        setConfig({});
      }
      setGenerationResult(null);
    }
  }, [initialConfig, isOpen, resolvedPreset, resolvedTemplate]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      const firstInteractive = modalBodyRef.current?.querySelector<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      firstInteractive?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [currentStep, isOpen]);

  const handleSelectTemplate = useCallback(
    (template: (typeof templates)[number]) => {
      setConfig({
        projectType: template.projectType,
        templateId: template.id,
        uiLibrary: template.supportedUiLibraries[0] ?? "tailwind",
        features: ["typescript"],
        description: template.description,
        packageManager: "npm",
      });
      setCurrentStep("configuration");
    },
    [],
  );

  const handleConfigurationSubmit = useCallback(
    async (projectConfig: ScaffoldingConfig) => {
      setConfig(projectConfig);
      setCurrentStep("generation");
      try {
        const result = await launchScaffold.mutateAsync(projectConfig);
        setGenerationResult(result);
        onClose();
        navigate(`/conversations/${result.navigationId}`);
      } catch (error) {
        setGenerationResult({
          success: false,
          navigationId: "",
          startTaskId: "",
          status: "ERROR",
          detail: error instanceof Error ? error.message : "Unknown error",
          errors: [error instanceof Error ? error.message : "Unknown error"],
          warnings: [],
          projectName: projectConfig.projectName,
        });
      }
    },
    [launchScaffold, navigate, onClose],
  );

  const handleBack = useCallback(() => {
    if (currentStep === "configuration") {
      setCurrentStep("project-type");
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setCurrentStep("project-type");
    setConfig({});
    setGenerationResult(null);
  }, []);

  if (!isOpen) return null;

  const stepIndex = getStepIndex(currentStep);
  const totalSteps = 3;
  const showStepIndicator = !(
    currentStep === "project-type" && isTemplatesLoading
  );
  const stepMeta = STEP_COPY[currentStep];

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        ref={modalBodyRef}
        width="medium"
        role="dialog"
        aria-modal="true"
        aria-label="Scaffold wizard"
        tabIndex={-1}
        className="border border-tertiary !gap-4"
      >
        <div className="w-full">
          {/* Step Indicator */}
          {showStepIndicator ? (
            <div className="mb-6 space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    Step {stepIndex + 1} of {totalSteps}
                  </div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {stepMeta.label}
                  </div>
                </div>
                <div className="hidden text-sm text-neutral-400 sm:block">
                  {stepMeta.description}
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300/80 via-sky-300/85 to-blue-400/80 transition-[width] duration-300"
                  style={{
                    width: `${((stepIndex + 1) / totalSteps) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {/* Step Content */}
          {currentStep === "project-type" && (
            <ProjectTypeStep
              templates={templates}
              isLoading={isTemplatesLoading}
              onSelect={handleSelectTemplate}
            />
          )}

          {currentStep === "configuration" &&
            selectedTemplate &&
            config.projectType && (
              <ConfigurationStep
                template={selectedTemplate}
                preset={selectedPreset}
                initialConfig={config}
                onSubmit={handleConfigurationSubmit}
                onBack={handleBack}
              />
            )}

          {currentStep === "generation" && (
            <GenerationStep
              isGenerating={launchScaffold.isPending}
              result={generationResult}
              onReset={handleReset}
              onClose={onClose}
            />
          )}
        </div>
      </ModalBody>
    </ModalBackdrop>
  );
}
