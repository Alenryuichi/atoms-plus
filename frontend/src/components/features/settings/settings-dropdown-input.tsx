import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { OptionalTag } from "./optional-tag";
import { cn } from "#/lib/utils";
import { Combobox, ComboboxItem } from "#/components/ui/combobox";

interface SettingsDropdownInputProps {
  testId: string;
  name: string;
  items: { key: React.Key; label: string }[];
  label?: ReactNode;
  wrapperClassName?: string;
  placeholder?: string;
  showOptionalTag?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  defaultSelectedKey?: string;
  selectedKey?: string;
  isClearable?: boolean;
  allowsCustomValue?: boolean;
  required?: boolean;
  onSelectionChange?: (key: React.Key | null) => void;
  onInputChange?: (value: string) => void;
  defaultFilter?: (textValue: string, inputValue: string) => boolean;
  startContent?: ReactNode;
  inputWrapperClassName?: string;
}

export function SettingsDropdownInput({
  testId,
  label,
  wrapperClassName,
  name,
  items,
  placeholder,
  showOptionalTag,
  isDisabled,
  isLoading,
  defaultSelectedKey,
  selectedKey,
  isClearable,
  allowsCustomValue,
  required,
  onSelectionChange,
  onInputChange,
  defaultFilter,
  startContent,
  inputWrapperClassName,
}: SettingsDropdownInputProps) {
  const { t } = useTranslation();

  // Transform items to ComboboxItem format
  const comboboxItems: ComboboxItem[] = items.map((item) => ({
    value: String(item.key),
    label: item.label,
  }));

  const handleValueChange = (value: string | null) => {
    onSelectionChange?.(value);
  };

  return (
    <label className={cn("flex flex-col gap-2.5", wrapperClassName)}>
      {label && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-neutral-300">{label}</span>
          {showOptionalTag && <OptionalTag />}
        </div>
      )}
      <Combobox
        aria-label={typeof label === "string" ? label : name}
        data-testid={testId}
        name={name}
        items={comboboxItems}
        defaultValue={defaultSelectedKey}
        value={selectedKey}
        onValueChange={handleValueChange}
        onInputChange={onInputChange}
        isClearable={isClearable}
        disabled={isDisabled || isLoading}
        isLoading={isLoading}
        placeholder={isLoading ? t("HOME$LOADING") : placeholder}
        allowsCustomValue={allowsCustomValue}
        required={required}
        defaultFilter={defaultFilter}
        startContent={startContent}
        triggerClassName={cn(
          "bg-black/40 border border-white/10 h-10 w-full rounded-lg px-3 py-2",
          "text-white placeholder:text-neutral-500",
          "transition-all duration-300",
          "hover:border-white/20 hover:bg-black/50",
          "focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20",
          "data-[state=open]:border-amber-500/50 data-[state=open]:ring-2 data-[state=open]:ring-amber-500/20",
          inputWrapperClassName,
        )}
        popoverClassName="z-[100] bg-black/90 backdrop-blur-xl rounded-xl border border-amber-500/20 shadow-xl shadow-black/50"
      />
    </label>
  );
}
