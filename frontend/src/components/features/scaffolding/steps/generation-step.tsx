/* eslint-disable i18next/no-literal-string */
import React from "react";
import { BrandButton } from "#/components/features/settings/brand-button";
import { LoadingSpinner } from "#/components/shared/loading-spinner";

interface GenerationStepProps {
  isGenerating: boolean;
  result: {
    success: boolean;
    projectPath?: string;
    nextSteps?: string[];
    errors?: string[];
  } | null;
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
            Generating Project...
          </h2>
          <p className="text-sm text-neutral-400">
            Setting up your project structure
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
            Project Created!
          </h2>
          <p className="text-sm text-neutral-400">
            Your project has been generated successfully
          </p>
        </div>

        {result.projectPath && (
          <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
            <span className="text-xs text-neutral-400">Project Location</span>
            <code className="block mt-1 text-sm text-primary font-mono">
              {result.projectPath}
            </code>
          </div>
        )}

        {result.nextSteps && result.nextSteps.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-white">Next Steps</span>
            <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
              <ol className="space-y-2">
                {result.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <code className="text-sm font-mono text-neutral-300">
                      {step}
                    </code>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-3 pt-4">
          <BrandButton type="button" variant="secondary" onClick={onReset}>
            Create Another
          </BrandButton>
          <BrandButton type="button" variant="primary" onClick={onClose}>
            Done
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
