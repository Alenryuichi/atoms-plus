/* eslint-disable i18next/no-literal-string */
import React, { useState } from "react";
import { cn } from "#/utils/utils";
import { BrandButton } from "#/components/features/settings/brand-button";
import { SettingsInput } from "#/components/features/settings/settings-input";
import {
  ProjectType,
  UILibrary,
  Feature,
  ScaffoldingConfig,
  PROJECT_TYPES,
  UI_LIBRARIES,
  FEATURES,
} from "../types";

interface ConfigurationStepProps {
  projectType: ProjectType;
  onSubmit: (config: ScaffoldingConfig) => void;
  onBack: () => void;
}

export function ConfigurationStep({
  projectType,
  onSubmit,
  onBack,
}: ConfigurationStepProps) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [uiLibrary, setUiLibrary] = useState<UILibrary>("tailwind");
  const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([
    "typescript",
  ]);
  const [packageManager, setPackageManager] = useState<"npm" | "yarn" | "pnpm">(
    "npm",
  );

  const projectTypeInfo = PROJECT_TYPES.find((p) => p.id === projectType);

  const toggleFeature = (feature: Feature) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    onSubmit({
      projectType,
      projectName: projectName.trim().toLowerCase().replace(/\s+/g, "-"),
      description: description.trim() || `A ${projectTypeInfo?.name} project`,
      uiLibrary,
      features: selectedFeatures,
      packageManager,
    });
  };

  const isValid = projectName.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">{projectTypeInfo?.icon}</span>
          <h2 className="text-xl font-semibold text-white">
            {projectTypeInfo?.name} Project
          </h2>
        </div>
        <p className="text-sm text-neutral-400">Configure your project</p>
      </div>

      {/* Project Name */}
      <SettingsInput
        testId="project-name-input"
        name="project-name"
        label="Project Name"
        type="text"
        value={projectName}
        onChange={setProjectName}
        placeholder="my-awesome-app"
        className="w-full"
        required
      />

      {/* Description */}
      <SettingsInput
        testId="project-description-input"
        name="project-description"
        label="Description"
        type="text"
        value={description}
        onChange={setDescription}
        placeholder="A brief description of your project"
        className="w-full"
        showOptionalTag
      />

      {/* UI Library Selection */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-white">UI Library</span>
        <div className="flex gap-2 flex-wrap">
          {UI_LIBRARIES.map((lib) => (
            <button
              key={lib.id}
              type="button"
              onClick={() => setUiLibrary(lib.id)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md border transition-colors",
                uiLibrary === lib.id
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-neutral-600 text-neutral-400 hover:border-neutral-400",
              )}
            >
              {lib.name}
            </button>
          ))}
        </div>
      </div>

      {/* Features Selection */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-white">Features</span>
        <div className="flex gap-2 flex-wrap">
          {FEATURES.map((feature) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => toggleFeature(feature.id)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md border transition-colors",
                selectedFeatures.includes(feature.id)
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-neutral-600 text-neutral-400 hover:border-neutral-400",
              )}
            >
              {feature.name}
            </button>
          ))}
        </div>
      </div>

      {/* Package Manager */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-white">Package Manager</span>
        <div className="flex gap-2">
          {(["npm", "yarn", "pnpm"] as const).map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => setPackageManager(pm)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md border transition-colors",
                packageManager === pm
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-neutral-600 text-neutral-400 hover:border-neutral-400",
              )}
            >
              {pm}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-4">
        <BrandButton type="button" variant="secondary" onClick={onBack}>
          Back
        </BrandButton>
        <BrandButton type="submit" variant="primary" isDisabled={!isValid}>
          Generate Project
        </BrandButton>
      </div>
    </form>
  );
}
