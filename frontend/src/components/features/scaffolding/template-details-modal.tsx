/* eslint-disable i18next/no-literal-string */

import React from "react";
import {
  FEATURE_METADATA,
  PROJECT_TYPE_METADATA,
  ScaffoldingPreset,
  UI_LIBRARY_METADATA,
} from "./types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "#/components/ui/dialog";
import { TemplatePreviewSurface } from "./template-preview-surface";

interface TemplateDetailsModalProps {
  preset?: ScaffoldingPreset;
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  isContinueReady?: boolean;
  preventCloseAutoFocusRef?: React.MutableRefObject<boolean>;
}

const CATEGORY_LABELS: Record<string, string> = {
  saas: "SaaS Apps",
  ecommerce: "Commerce",
  internal: "Internal Tools",
  personal: "Personal Projects",
};

const PACKAGE_MANAGER_LABELS: Record<string, string> = {
  npm: "npm",
  yarn: "Yarn",
  pnpm: "pnpm",
  bun: "Bun",
};

const humanizeFeatureId = (featureId: string) =>
  featureId
    .split("-")
    .map((part) =>
      part.length ? `${part[0].toUpperCase()}${part.slice(1)}` : part,
    )
    .join(" ");

export function TemplateDetailsModal({
  preset,
  isOpen,
  onClose,
  onContinue,
  isContinueReady = true,
  preventCloseAutoFocusRef,
}: TemplateDetailsModalProps) {
  const continueButtonRef = React.useRef<HTMLButtonElement>(null);
  const focusOverrideRef = preventCloseAutoFocusRef;

  if (!preset) return null;

  const projectType = preset.defaultConfig?.projectType
    ? PROJECT_TYPE_METADATA[preset.defaultConfig.projectType]
    : undefined;
  const uiLibrary = preset.defaultConfig?.uiLibrary
    ? UI_LIBRARY_METADATA[preset.defaultConfig.uiLibrary]
    : undefined;
  const packageManager = preset.defaultConfig?.packageManager
    ? PACKAGE_MANAGER_LABELS[preset.defaultConfig.packageManager]
    : undefined;
  const featureEntries =
    preset.defaultConfig?.features.map(
      (feature) =>
        FEATURE_METADATA[feature] ?? {
          id: feature,
          name: humanizeFeatureId(feature),
          description: "Included in this preset starter.",
        },
    ) ?? [];
  const customizableOptions = [
    preset.supportedOverrides.projectName ? "Project name" : null,
    preset.supportedOverrides.uiLibrary ? "UI library" : null,
    preset.supportedOverrides.features ? "Feature set" : null,
    preset.supportedOverrides.description ? "Product copy" : null,
    preset.supportedOverrides.packageManager ? "Package manager" : null,
  ].filter(Boolean) as string[];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          continueButtonRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          if (focusOverrideRef?.current) {
            event.preventDefault();
            focusOverrideRef.current = false;
          }
        }}
        className="max-h-[88vh] max-w-6xl overflow-hidden border-white/10 bg-[#060816]/95 p-0 text-white shadow-[0_40px_140px_rgba(2,6,23,0.78)] backdrop-blur-xl"
      >
        <div className="grid max-h-[88vh] grid-cols-1 overflow-hidden lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] p-5 sm:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-25" />
            <div className="relative space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100">
                  {CATEGORY_LABELS[preset.category] ?? preset.category}
                </span>
                {projectType ? (
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-neutral-200">
                    {projectType.name}
                  </span>
                ) : null}
                {uiLibrary ? (
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-neutral-200">
                    {uiLibrary.name}
                  </span>
                ) : null}
                {preset.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-neutral-300/85"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <TemplatePreviewSurface
                preset={preset}
                variant="modal"
                alt={`${preset.title} template preview`}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                    Best for
                  </div>
                  <div className="mt-2 text-sm font-medium text-white">
                    {preset.tags.slice(0, 2).join(" + ") || "Starter projects"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                    Stack
                  </div>
                  <div className="mt-2 text-sm font-medium text-white">
                    {projectType?.name ?? "Framework"} /{" "}
                    {uiLibrary?.name ?? "UI"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                    Setup
                  </div>
                  <div className="mt-2 text-sm font-medium text-white">
                    {packageManager ?? "npm"} + starter defaults
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col border-t border-white/10 lg:border-l lg:border-t-0">
            <div className="space-y-3 px-6 pt-6 sm:px-8 sm:pt-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200/70">
                Template Preview
              </div>
              <DialogTitle className="text-3xl font-semibold tracking-tight text-white sm:text-[2.15rem]">
                {preset.title}
              </DialogTitle>
              <DialogDescription className="max-w-xl text-base leading-7 text-neutral-300">
                {preset.description}
              </DialogDescription>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
              <div className="space-y-5">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-300">
                    Included by default
                  </h3>
                  <ul className="grid gap-2">
                    {featureEntries.map((feature) => (
                      <li
                        key={feature.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-cyan-300/75" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">
                            {feature.name}
                          </div>
                          {feature.description ? (
                            <p className="mt-0.5 line-clamp-1 text-xs text-neutral-400">
                              {feature.description}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-300">
                    Configuration
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm text-neutral-300">
                    <li className="flex items-start justify-between gap-3">
                      <span className="text-neutral-400">Framework</span>
                      <span className="text-right text-white">
                        {projectType?.name ?? "Not specified"}
                      </span>
                    </li>
                    <li className="flex items-start justify-between gap-3">
                      <span className="text-neutral-400">UI library</span>
                      <span className="text-right text-white">
                        {uiLibrary?.name ?? "Not specified"}
                      </span>
                    </li>
                    <li className="flex items-start justify-between gap-3">
                      <span className="text-neutral-400">Package manager</span>
                      <span className="text-right text-white">
                        {packageManager ?? "Not specified"}
                      </span>
                    </li>
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {customizableOptions.map((option) => (
                      <span
                        key={option}
                        className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100"
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative border-t border-white/10 bg-[linear-gradient(180deg,rgba(6,8,22,0.88),rgba(6,8,22,0.97))] px-6 py-4 shadow-[0_-18px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:px-8">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-t from-transparent to-[#060816]/80" />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-sm text-neutral-400">
                  You can fine-tune the project in the next step.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={onContinue}
                    ref={continueButtonRef}
                    disabled={!isContinueReady}
                    className="whitespace-nowrap rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_40px_rgba(251,191,36,0.28)] transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {isContinueReady ? "Continue" : "Preparing..."}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
