import React, { useState, useCallback } from "react";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { cn } from "#/utils/utils";
import { ProjectTypeStep } from "./steps/project-type-step";
import { ConfigurationStep } from "./steps/configuration-step";
import { GenerationStep } from "./steps/generation-step";
import { ScaffoldingConfig, ProjectType } from "./types";

interface ScaffoldWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export type WizardStep = "project-type" | "configuration" | "generation";

const getStepIndex = (step: WizardStep): number => {
  if (step === "project-type") return 0;
  if (step === "configuration") return 1;
  return 2;
};

export function ScaffoldWizard({ isOpen, onClose }: ScaffoldWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("project-type");
  const [config, setConfig] = useState<Partial<ScaffoldingConfig>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{
    success: boolean;
    projectPath?: string;
    nextSteps?: string[];
    errors?: string[];
  } | null>(null);

  const generateProject = useCallback(
    async (projectConfig: ScaffoldingConfig) => {
      setIsGenerating(true);
      try {
        const response = await fetch("/api/v1/scaffolding/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: projectConfig.projectName,
            project_type: projectConfig.projectType,
            ui_library: projectConfig.uiLibrary,
            features: projectConfig.features,
            description: projectConfig.description,
            author: projectConfig.author || "atoms-plus-user",
            package_manager: projectConfig.packageManager || "npm",
          }),
        });
        const result = await response.json();
        setGenerationResult(result);
      } catch (error) {
        setGenerationResult({
          success: false,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  const handleSelectProjectType = useCallback((projectType: ProjectType) => {
    setConfig((prev) => ({ ...prev, projectType }));
    setCurrentStep("configuration");
  }, []);

  const handleConfigurationSubmit = useCallback(
    (projectConfig: ScaffoldingConfig) => {
      setConfig(projectConfig);
      setCurrentStep("generation");
      generateProject(projectConfig);
    },
    [generateProject],
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
    setIsGenerating(false);
  }, []);

  if (!isOpen) return null;

  const stepIndex = getStepIndex(currentStep);
  const totalSteps = 3;

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody width="medium" className="border border-tertiary !gap-4">
        <div className="w-full">
          {/* Step Indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index <= stepIndex ? "bg-primary" : "bg-neutral-600",
                )}
              />
            ))}
          </div>

          {/* Step Content */}
          {currentStep === "project-type" && (
            <ProjectTypeStep onSelect={handleSelectProjectType} />
          )}

          {currentStep === "configuration" && config.projectType && (
            <ConfigurationStep
              projectType={config.projectType}
              onSubmit={handleConfigurationSubmit}
              onBack={handleBack}
            />
          )}

          {currentStep === "generation" && (
            <GenerationStep
              isGenerating={isGenerating}
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
