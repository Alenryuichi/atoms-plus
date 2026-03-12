/* eslint-disable i18next/no-literal-string */
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "#/utils/utils";
import { PROJECT_TYPE_METADATA, ScaffoldingTemplate } from "../types";

interface ProjectTypeStepProps {
  templates: ScaffoldingTemplate[];
  isLoading?: boolean;
  onSelect: (template: ScaffoldingTemplate) => void;
}

const CARD_SHELL_CLASSNAME =
  "relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,28,0.98),rgba(12,16,30,0.94))] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.24)]";

const CARD_SHIMMER_CLASSNAME =
  "pointer-events-none absolute inset-y-0 left-[-45%] w-[40%] bg-gradient-to-r from-transparent via-white/10 to-transparent";

export function ProjectTypeStep({
  templates,
  isLoading,
  onSelect,
}: ProjectTypeStepProps) {
  const prefersReducedMotion = useReducedMotion();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 py-4" aria-busy="true">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded-full bg-white/10" />
          <div className="h-3 w-72 rounded-full bg-white/6" />
        </div>

        <div
          className="grid grid-cols-2 gap-4"
          aria-hidden="true"
          role="presentation"
        >
          {[0, 1].map((index) => (
            <div key={index} className={CARD_SHELL_CLASSNAME}>
              <motion.div
                className={CARD_SHIMMER_CLASSNAME}
                animate={
                  prefersReducedMotion ? undefined : { x: ["0%", "260%"] }
                }
                transition={{
                  duration: 1.9,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                  delay: index * 0.18,
                }}
              />

              <div className="relative space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/8" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-28 rounded-full bg-white/10" />
                      <div className="h-2.5 w-20 rounded-full bg-white/[0.07]" />
                    </div>
                  </div>
                  <div className="h-6 w-16 rounded-full bg-cyan-300/10" />
                </div>

                <div className="space-y-2.5">
                  <div className="h-2.5 w-full rounded-full bg-white/8" />
                  <div className="h-2.5 w-[84%] rounded-full bg-white/[0.07]" />
                  <div className="h-2.5 w-[65%] rounded-full bg-white/[0.06]" />
                </div>

                <div className="flex gap-2 pt-2">
                  <div className="h-8 w-20 rounded-full bg-white/[0.06]" />
                  <div className="h-8 w-24 rounded-full bg-white/[0.05]" />
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-6 bottom-4 h-px bg-gradient-to-r from-transparent via-cyan-200/25 to-transparent" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => {
          const metadata = PROJECT_TYPE_METADATA[template.projectType];

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className={cn(
                CARD_SHELL_CLASSNAME,
                "group text-left transition-all duration-200 hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(12,17,32,0.99),rgba(14,19,34,0.96))]",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-neutral-900",
              )}
            >
              <div className="pointer-events-none absolute inset-x-6 bottom-4 h-px bg-gradient-to-r from-transparent via-cyan-200/0 to-transparent transition duration-200 group-hover:via-cyan-200/22" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/7 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {metadata.icon}
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      Framework
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {template.name}
                    </div>
                  </div>
                </div>
                <div className="rounded-full border border-cyan-300/16 bg-cyan-300/8 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-100/75">
                  {template.projectType}
                </div>
              </div>

              <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-400">
                {template.description || metadata.description}
              </p>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/8 bg-white/[0.045] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                    Starter
                  </span>
                  <span className="rounded-full border border-white/8 bg-white/[0.045] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                    Guided
                  </span>
                </div>
                <span className="text-xs font-medium text-neutral-300 transition group-hover:text-white">
                  Configure
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
