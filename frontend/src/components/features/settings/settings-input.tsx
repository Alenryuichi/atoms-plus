import { cn } from "#/utils/utils";
import { OptionalTag } from "./optional-tag";

interface SettingsInputProps {
  testId?: string;
  name?: string;
  label: string;
  type: React.HTMLInputTypeAttribute;
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  showOptionalTag?: boolean;
  isDisabled?: boolean;
  startContent?: React.ReactNode;
  className?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  labelClassName?: string;
}

export function SettingsInput({
  testId,
  name,
  label,
  type,
  defaultValue,
  value,
  placeholder,
  showOptionalTag,
  isDisabled,
  startContent,
  className,
  onChange,
  required,
  min,
  max,
  step,
  pattern,
  labelClassName,
}: SettingsInputProps) {
  return (
    <label className={cn("flex flex-col gap-2.5 w-fit", className)}>
      <div className="flex items-center gap-2">
        {startContent}
        <span className={cn("text-sm text-neutral-300", labelClassName)}>{label}</span>
        {showOptionalTag && <OptionalTag />}
      </div>
      <input
        data-testid={testId}
        onChange={(e) => onChange && onChange(e.target.value)}
        name={name}
        disabled={isDisabled}
        type={type}
        defaultValue={defaultValue}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        required={required}
        pattern={pattern}
        className={cn(
          "bg-black/40 border border-white/10 h-10 w-full rounded-lg px-3 py-2",
          "text-white placeholder:text-neutral-500 placeholder:italic",
          "transition-all duration-300",
          "focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 focus:bg-black/60",
          "hover:border-white/20 hover:bg-black/50",
          "disabled:bg-neutral-900/50 disabled:border-neutral-800 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
    </label>
  );
}
