/* eslint-disable i18next/no-literal-string */
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "#/utils/utils";
import { BrandButton } from "#/components/features/settings/brand-button";
import { SettingsInput } from "#/components/features/settings/settings-input";
import {
  FEATURE_METADATA,
  PROJECT_TYPE_METADATA,
  PackageManager,
  ScaffoldingConfig,
  ScaffoldingPreset,
  ScaffoldingTemplate,
  UILibrary,
  UI_LIBRARY_METADATA,
} from "../types";
import { useScaffoldingFeatures } from "#/hooks/query/use-scaffolding-features";
import { useScaffoldingUiLibraries } from "#/hooks/query/use-scaffolding-ui-libraries";

interface ConfigurationStepProps {
  template: ScaffoldingTemplate;
  preset?: ScaffoldingPreset;
  initialConfig?: Partial<ScaffoldingConfig>;
  onSubmit: (config: ScaffoldingConfig) => void;
  onBack: () => void;
}

export function ConfigurationStep({
  template,
  preset,
  initialConfig,
  onSubmit,
  onBack,
}: ConfigurationStepProps) {
  const { data: uiLibrariesData } = useScaffoldingUiLibraries();
  const { data: featuresData } = useScaffoldingFeatures();
  const projectTypeInfo = PROJECT_TYPE_METADATA[template.projectType];
  const supportedOverrides = preset?.supportedOverrides ?? {
    uiLibrary: true,
    features: true,
    projectName: true,
    description: true,
    packageManager: true,
  };

  const availableUiLibraries = useMemo(() => {
    const libraries =
      uiLibrariesData?.ui_libraries.map((library) => ({
        id: library.id,
        name: library.name,
        description: library.name,
      })) ??
      template.supportedUiLibraries.map((library) => ({
        id: library,
        name: UI_LIBRARY_METADATA[library].name,
        description: UI_LIBRARY_METADATA[library].description,
      }));

    return libraries.filter((library) =>
      template.supportedUiLibraries.includes(library.id as UILibrary),
    );
  }, [template.supportedUiLibraries, uiLibrariesData]);

  const availableFeatures = useMemo(() => {
    if (featuresData?.features.length) {
      return featuresData.features.map((feature) => ({
        id: feature.id,
        name: feature.name,
        description:
          FEATURE_METADATA[feature.id]?.description ?? feature.name,
      }));
    }

    return Object.values(FEATURE_METADATA);
  }, [featuresData]);

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [uiLibrary, setUiLibrary] = useState<UILibrary>("tailwind");
  const [selectedFeatures, setSelectedFeatures] = useState<
    ScaffoldingConfig["features"]
  >(["typescript"]);
  const [packageManager, setPackageManager] = useState<PackageManager>("npm");

  useEffect(() => {
    const fallbackUiLibrary =
      initialConfig?.uiLibrary ??
      preset?.defaultConfig?.uiLibrary ??
      template.supportedUiLibraries[0] ??
      "tailwind";

    setProjectName(initialConfig?.projectName ?? preset?.id ?? "");
    setDescription(
      initialConfig?.description ??
        preset?.defaultConfig?.description ??
        template.description,
    );
    setUiLibrary(fallbackUiLibrary);
    setSelectedFeatures(
      initialConfig?.features ??
        preset?.defaultConfig?.features ??
        ["typescript"],
    );
    setPackageManager(
      initialConfig?.packageManager ??
        preset?.defaultConfig?.packageManager ??
        "npm",
    );
  }, [initialConfig, preset, template]);

  const toggleFeature = (feature: ScaffoldingConfig["features"][number]) => {
    if (!supportedOverrides.features) {
      return;
    }
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature],
    );
  };

  const sanitizeProjectName = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedName = sanitizeProjectName(projectName);
    if (!sanitizedName) return;

    onSubmit({
      projectType: template.projectType,
      projectName: sanitizedName,
      description: description.trim() || `A ${projectTypeInfo.name} project`,
      templateId: template.id,
      presetId: preset?.id,
      uiLibrary,
      features: selectedFeatures,
      packageManager,
    });
  };

  const isValid = sanitizeProjectName(projectName).length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">{projectTypeInfo.icon}</span>
          <h2 className="text-xl font-semibold text-white">
            {preset?.title ?? template.name}
          </h2>
        </div>
        <p className="text-sm text-neutral-400">
          {preset?.description ?? "Configure your project"}
        </p>
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
        isDisabled={!supportedOverrides.projectName}
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
        isDisabled={!supportedOverrides.description}
      />

      {/* UI Library Selection */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-white">UI Library</span>
        <div className="flex gap-2 flex-wrap">
          {availableUiLibraries.map((lib) => (
            <button
              key={lib.id}
              type="button"
              onClick={() => setUiLibrary(lib.id)}
              disabled={!supportedOverrides.uiLibrary}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md border transition-colors",
                uiLibrary === lib.id
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-neutral-600 text-neutral-400 hover:border-neutral-400",
                !supportedOverrides.uiLibrary && "cursor-not-allowed opacity-60",
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
          {availableFeatures.map((feature) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => toggleFeature(feature.id)}
              disabled={!supportedOverrides.features}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md border transition-colors",
                selectedFeatures.includes(feature.id)
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-neutral-600 text-neutral-400 hover:border-neutral-400",
                !supportedOverrides.features && "cursor-not-allowed opacity-60",
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
          {(["npm", "yarn", "pnpm", "bun"] as const).map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => setPackageManager(pm)}
              disabled={!supportedOverrides.packageManager}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md border transition-colors",
                packageManager === pm
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-neutral-600 text-neutral-400 hover:border-neutral-400",
                !supportedOverrides.packageManager &&
                  "cursor-not-allowed opacity-60",
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
          Launch Template
        </BrandButton>
      </div>
    </form>
  );
}
