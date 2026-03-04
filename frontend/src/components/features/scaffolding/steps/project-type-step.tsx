/* eslint-disable i18next/no-literal-string */
import React from "react";
import { cn } from "#/utils/utils";
import { ProjectType, PROJECT_TYPES } from "../types";

interface ProjectTypeStepProps {
  onSelect: (projectType: ProjectType) => void;
}

export function ProjectTypeStep({ onSelect }: ProjectTypeStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">
          Create New Project
        </h2>
        <p className="text-sm text-neutral-400">
          Choose your preferred framework to get started
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PROJECT_TYPES.map((projectType) => (
          <button
            key={projectType.id}
            type="button"
            onClick={() => onSelect(projectType.id)}
            className={cn(
              "flex flex-col items-start gap-3 p-4 rounded-lg border border-neutral-700",
              "bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-500",
              "transition-all cursor-pointer text-left",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-neutral-900",
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <span className="text-2xl">{projectType.icon}</span>
              <span className="font-medium text-white">{projectType.name}</span>
            </div>
            <p className="text-xs text-neutral-400">
              {projectType.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
