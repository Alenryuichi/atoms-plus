import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { ToolParameters } from "./tool-parameters";
import { ChatCompletionToolParam } from "#/types/v1/core";
import { MarkdownRenderer } from "../../markdown/markdown-renderer";
import { cn } from "#/utils/utils";

interface FunctionData {
  name?: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

interface ToolData {
  // V0/OpenAI format
  type?: string;
  function?: FunctionData;
  name?: string;
  description?: string;
  parameters?: Record<string, unknown>;
  // V1 format
  title?: string;
  kind?: string;
  annotations?: {
    title?: string;
  };
}

interface ToolItemProps {
  tool: Record<string, unknown> | ChatCompletionToolParam;
  index: number;
  isExpanded: boolean;
  onToggle: (index: number) => void;
}

export function ToolItem({ tool, index, isExpanded, onToggle }: ToolItemProps) {
  // Extract function data from the nested structure
  const toolData = tool as ToolData;
  const functionData = toolData.function || toolData;

  // Extract tool name/title - support both V0 and V1 formats
  const name =
    // V1 format: check for title field (root level or in annotations)
    toolData.title ||
    toolData.annotations?.title ||
    // V0 format: check for function.name or name
    functionData.name ||
    (toolData.type === "function" && toolData.function?.name) ||
    "";

  // Extract description - support both V0 and V1 formats
  const description =
    // V1 format: description at root level
    toolData.description ||
    // V0 format: description in function object
    functionData.description ||
    (toolData.type === "function" && toolData.function?.description) ||
    "";

  // Extract parameters - support both V0 and V1 formats
  const parameters =
    // V0 format: parameters in function object
    functionData.parameters ||
    (toolData.type === "function" && toolData.function?.parameters) ||
    // V1 format: parameters at root level (if present)
    toolData.parameters ||
    null;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-200",
        isExpanded
          ? "bg-white/5 border-white/10"
          : "bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.02]",
      )}
    >
      {/* Tool header button */}
      <button
        type="button"
        onClick={() => onToggle(index)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500/60" />
          <span className="text-sm font-medium text-white/80">
            {String(name)}
          </span>
        </div>
        <span className="text-white/40">
          {isExpanded ? (
            <IconChevronDown size={16} stroke={1.5} />
          ) : (
            <IconChevronRight size={16} stroke={1.5} />
          )}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/5">
          {description && (
            <div className="mt-3 text-sm text-white/60 leading-relaxed">
              <MarkdownRenderer>{String(description)}</MarkdownRenderer>
            </div>
          )}

          {/* Parameters section */}
          {parameters && (
            <div className="mt-4">
              <ToolParameters parameters={parameters} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
