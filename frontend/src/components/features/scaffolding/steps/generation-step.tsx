/* eslint-disable i18next/no-literal-string */
import React from "react";
import { BrandButton } from "#/components/features/settings/brand-button";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { ScaffoldingLaunchResult } from "../types";

interface GenerationStepProps {
  isGenerating: boolean;
  result: ScaffoldingLaunchResult | null;
  onReset: () => void;
  onClose: () => void;
}

export function GenerationStep({
  isGenerating,
  result,
  onReset,
  onClose,
}: GenerationStepProps) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <LoadingSpinner size="large" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Preparing Workspace...
          </h2>
          <p className="text-sm text-neutral-400">
            Generating starter files and launching your conversation
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  if (result.success) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Workspace Ready
          </h2>
          <p className="text-sm text-neutral-400">
            Opening your scaffolded conversation workspace
          </p>
        </div>

        <div className="flex justify-between gap-3 pt-4">
          <BrandButton type="button" variant="secondary" onClick={onReset}>
            Launch Another
          </BrandButton>
          <BrandButton type="button" variant="primary" onClick={onClose}>
            Close
          </BrandButton>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Generation Failed
        </h2>
        <p className="text-sm text-neutral-400">
          Something went wrong while creating your project
        </p>
      </div>

      {result.errors && result.errors.length > 0 && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-700">
          <span className="text-xs text-red-400 block mb-2">Errors</span>
          <ul className="space-y-1">
            {result.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-300">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-center gap-3 pt-4">
        <BrandButton type="button" variant="secondary" onClick={onReset}>
          Try Again
        </BrandButton>
      </div>
    </div>
  );
}
