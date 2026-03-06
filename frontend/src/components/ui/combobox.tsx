"use client";

/**
 * Combobox Component
 *
 * A feature-rich autocomplete/dropdown component built on shadcn/ui Command.
 * Supports grouped items, custom values, clearable selection, and loading states.
 *
 * @example
 * ```tsx
 * <Combobox
 *   items={[{ value: "1", label: "Option 1" }]}
 *   onValueChange={(value) => console.log(value)}
 *   placeholder="Select..."
 * />
 * ```
 */
import * as React from "react";
import {
  IconCheck,
  IconSelector,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";

export interface ComboboxItem {
  value: string;
  label: string;
}

export interface ComboboxGroup {
  label: string;
  items: ComboboxItem[];
}

interface ComboboxProps {
  items?: ComboboxItem[];
  groups?: ComboboxGroup[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  allowsCustomValue?: boolean;
  required?: boolean;
  triggerClassName?: string;
  popoverClassName?: string;
  startContent?: React.ReactNode;
  "data-testid"?: string;
  "aria-label"?: string;
  name?: string;
  defaultFilter?: (textValue: string, inputValue: string) => boolean;
}

export function Combobox({
  items = [],
  groups = [],
  value,
  defaultValue,
  onValueChange,
  onInputChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled,
  isLoading,
  isClearable = false,
  allowsCustomValue = false,
  required = false,
  triggerClassName,
  popoverClassName,
  startContent,
  "data-testid": testId,
  "aria-label": ariaLabel,
  name,
  defaultFilter,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");

  // Controlled vs uncontrolled
  const selectedValue = value !== undefined ? value : internalValue;

  // Get the selected item label
  const getSelectedLabel = React.useCallback(() => {
    if (!selectedValue) return null;

    // Check in flat items
    const flatItem = items.find((item) => item.value === selectedValue);
    if (flatItem) return flatItem.label;

    // Check in groups
    for (const group of groups) {
      const groupItem = group.items.find(
        (item) => item.value === selectedValue,
      );
      if (groupItem) return groupItem.label;
    }

    // If allowsCustomValue, return the raw value
    if (allowsCustomValue) return selectedValue;

    return selectedValue;
  }, [selectedValue, items, groups, allowsCustomValue]);

  const handleSelect = React.useCallback(
    (newValue: string) => {
      const finalValue = newValue === selectedValue ? "" : newValue;
      setInternalValue(finalValue);
      onValueChange?.(finalValue || null);
      setOpen(false);
    },
    [selectedValue, onValueChange],
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setInternalValue("");
      onValueChange?.(null);
      onInputChange?.("");
    },
    [onValueChange, onInputChange],
  );

  const handleInputChange = React.useCallback(
    (newInputValue: string) => {
      setInputValue(newInputValue);
      onInputChange?.(newInputValue);
    },
    [onInputChange],
  );

  // Filter function for search
  const filterFn = React.useCallback(
    (itemValue: string, search: string) => {
      if (!search) return 1;

      // Find the item to get its label
      let label = itemValue;
      const flatItem = items.find((item) => item.value === itemValue);
      if (flatItem) {
        label = flatItem.label;
      } else {
        for (const group of groups) {
          const groupItem = group.items.find(
            (item) => item.value === itemValue,
          );
          if (groupItem) {
            label = groupItem.label;
            break;
          }
        }
      }

      if (defaultFilter) {
        return defaultFilter(label.toLowerCase(), search.toLowerCase()) ? 1 : 0;
      }

      return label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
    },
    [items, groups, defaultFilter],
  );

  const renderItems = (itemList: ComboboxItem[]) =>
    itemList.map((item) => (
      <CommandItem
        key={item.value}
        value={item.value}
        onSelect={handleSelect}
        data-testid={`${testId}-item-${item.value}`}
      >
        {item.label}
        <IconCheck
          className={cn(
            "ml-auto h-4 w-4",
            selectedValue === item.value ? "opacity-100" : "opacity-0",
          )}
        />
      </CommandItem>
    ));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-required={required}
          data-testid={testId}
          disabled={disabled || isLoading}
          className={cn(
            "w-full justify-between bg-tertiary border-[#717888] h-10 rounded-sm p-2",
            !selectedValue && "text-muted-foreground italic",
            triggerClassName,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {startContent}
            {isLoading ? (
              <span className="flex items-center gap-2">
                <IconLoader2 size={16} stroke={1.5} className="animate-spin" />
                Loading...
              </span>
            ) : (
              getSelectedLabel() || placeholder
            )}
          </span>
          <span className="flex items-center gap-1">
            {isClearable && selectedValue && !disabled && !isLoading && (
              <IconX
                className="opacity-50 hover:opacity-100 cursor-pointer"
                size={16}
                stroke={1.5}
                onClick={handleClear}
              />
            )}
            <IconSelector
              size={16}
              stroke={1.5}
              className="shrink-0 opacity-50"
            />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0 bg-tertiary border-[#717888] rounded-xl",
          popoverClassName,
        )}
        align="start"
      >
        <Command filter={filterFn}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {items.length > 0 && (
              <CommandGroup>{renderItems(items)}</CommandGroup>
            )}
            {groups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {renderItems(group.items)}
              </CommandGroup>
            ))}
            {allowsCustomValue &&
              inputValue &&
              !items.find((i) => i.value === inputValue) &&
              !groups
                .flatMap((g) => g.items)
                .find((i) => i.value === inputValue) && (
                <CommandItem
                  value={inputValue}
                  onSelect={handleSelect}
                  aria-label={`Use custom value: ${inputValue}`}
                >
                  {/* eslint-disable-next-line i18next/no-literal-string -- UI indicator in low-level component */}
                  <span className="text-muted-foreground mr-1">Use:</span>
                  {inputValue}
                </CommandItem>
              )}
          </CommandList>
        </Command>
      </PopoverContent>
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={selectedValue || ""} />}
    </Popover>
  );
}
