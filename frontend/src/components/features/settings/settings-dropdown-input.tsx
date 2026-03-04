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
          <span className="text-sm">{label}</span>
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
          "bg-tertiary border border-neutral-600 h-10 w-full rounded-sm p-2",
          inputWrapperClassName,
        )}
        popoverClassName="bg-tertiary rounded-xl border border-neutral-600"
      />
    </label>
  );
}
