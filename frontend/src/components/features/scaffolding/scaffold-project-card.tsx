/* eslint-disable i18next/no-literal-string */
import React, { useState } from "react";
import { BrandButton } from "../settings/brand-button";
import { ScaffoldWizard } from "./scaffold-wizard";

export function ScaffoldProjectCard() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <>
      <section className="w-full min-h-[286px] md:min-h-auto flex flex-col rounded-[12px] p-[20px] gap-[10px] border border-[#727987] bg-[#26282D] relative">
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
          <span className="px-2 py-0.5 text-xs rounded bg-[#61DAFB]/20 text-[#61DAFB]">
            React
          </span>
          <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white">
            Next.js
          </span>
          <span className="px-2 py-0.5 text-xs rounded bg-[#42B883]/20 text-[#42B883]">
            Vue
          </span>
          <span className="px-2 py-0.5 text-xs rounded bg-[#00DC82]/20 text-[#00DC82]">
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
      </section>

      <ScaffoldWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </>
  );
}
