/* eslint-disable i18next/no-literal-string */
import React, { useState } from "react";
import { BrandButton } from "../settings/brand-button";
import { ScaffoldWizard } from "./scaffold-wizard";
import { SpotlightCard } from "#/components/ui/spotlight-card";

export function ScaffoldProjectCard() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <>
      <SpotlightCard className="w-full min-h-[280px] md:min-h-auto flex flex-col rounded-xl p-5 gap-3 border border-[var(--atoms-border-subtle)] bg-[var(--atoms-bg-card)] relative transition-all duration-300 hover:border-[var(--atoms-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <span className="text-lg">🚀</span>
            <span className="leading-5 font-bold text-base text-white">
              Scaffold New Project
            </span>
          </div>
        </div>
        <div>
          <span className="leading-[22px] text-sm font-normal text-white">
            Generate a complete frontend project with React, Next.js, Vue, or
            Nuxt. Includes TypeScript, Tailwind CSS, and modern best practices.
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/20">
            React
          </span>
          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-white/10 text-white/90 border border-white/10">
            Next.js
          </span>
          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            Vue
          </span>
          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-green-500/15 text-green-400 border border-green-500/20">
            Nuxt
          </span>
        </div>
        <BrandButton
          testId="launch-scaffold-wizard-button"
          variant="primary"
          type="button"
          onClick={() => setIsWizardOpen(true)}
          className="w-auto absolute bottom-5 left-5 right-5 font-semibold"
        >
          Create Project
        </BrandButton>
      </SpotlightCard>

      <ScaffoldWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </>
  );
}
