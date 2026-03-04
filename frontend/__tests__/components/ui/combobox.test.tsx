import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Combobox, ComboboxItem, ComboboxGroup } from "#/components/ui/combobox";

// jsdom does not implement scrollIntoView - required for cmdk
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Mock data for tests
const mockItems: ComboboxItem[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

const mockGroups: ComboboxGroup[] = [
  {
    label: "Fruits",
    items: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
    ],
  },
  {
    label: "Vegetables",
    items: [
      { value: "carrot", label: "Carrot" },
      { value: "broccoli", label: "Broccoli" },
    ],
  },
];

describe("Combobox", () => {
  const onValueChangeMock = vi.fn();
  const onInputChangeMock = vi.fn();

  afterEach(() => {
    onValueChangeMock.mockClear();
    onInputChangeMock.mockClear();
  });

  describe("Basic Rendering", () => {
    it("should render with placeholder when no value is selected", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          placeholder="Select a fruit..."
        />,
      );

      expect(screen.getByTestId("test-combobox")).toBeInTheDocument();
      expect(screen.getByText("Select a fruit...")).toBeInTheDocument();
    });

    it("should render with aria-label for accessibility", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          aria-label="Select fruit"
        />,
      );

      expect(screen.getByLabelText("Select fruit")).toBeInTheDocument();
    });

    it("should have combobox role", () => {
      render(<Combobox data-testid="test-combobox" items={mockItems} />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  describe("Controlled vs Uncontrolled State", () => {
    it("should work as uncontrolled with defaultValue", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          defaultValue="apple"
          onValueChange={onValueChangeMock}
        />,
      );

      expect(screen.getByText("Apple")).toBeInTheDocument();

      // Open dropdown and select different item
      await user.click(screen.getByTestId("test-combobox"));
      await user.click(screen.getByText("Banana"));

      expect(onValueChangeMock).toHaveBeenCalledWith("banana");
    });

    it("should work as controlled with value prop", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          value="apple"
          onValueChange={onValueChangeMock}
        />,
      );

      expect(screen.getByText("Apple")).toBeInTheDocument();

      // Open dropdown and select different item
      await user.click(screen.getByTestId("test-combobox"));
      await user.click(screen.getByText("Banana"));

      expect(onValueChangeMock).toHaveBeenCalledWith("banana");
      // Value should still show Apple until parent updates
      expect(screen.getByText("Apple")).toBeInTheDocument();

      // Parent updates the value
      rerender(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          value="banana"
          onValueChange={onValueChangeMock}
        />,
      );

      expect(screen.getByText("Banana")).toBeInTheDocument();
    });
  });

  describe("Item Selection and Deselection", () => {
    it("should select an item when clicked", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          onValueChange={onValueChangeMock}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));
      await user.click(screen.getByText("Cherry"));

      expect(onValueChangeMock).toHaveBeenCalledWith("cherry");
    });

    it("should deselect when clicking the same item again", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          defaultValue="apple"
          onValueChange={onValueChangeMock}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));
      // Use the specific test ID to click the Apple item in the dropdown
      await user.click(screen.getByTestId("test-combobox-item-apple"));

      expect(onValueChangeMock).toHaveBeenCalledWith(null);
    });

    it("should close dropdown after selection", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          onValueChange={onValueChangeMock}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));
      expect(screen.getByTestId("test-combobox")).toHaveAttribute(
        "aria-expanded",
        "true",
      );

      await user.click(screen.getByText("Cherry"));

      await waitFor(() => {
        expect(screen.getByTestId("test-combobox")).toHaveAttribute(
          "aria-expanded",
          "false",
        );
      });
    });
  });

  describe("Grouped Items", () => {
    it("should render grouped items with headings", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          groups={mockGroups}
          onValueChange={onValueChangeMock}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));

      expect(screen.getByText("Fruits")).toBeInTheDocument();
      expect(screen.getByText("Vegetables")).toBeInTheDocument();
      expect(screen.getByText("Apple")).toBeInTheDocument();
      expect(screen.getByText("Carrot")).toBeInTheDocument();
    });

    it("should select item from a group", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          groups={mockGroups}
          onValueChange={onValueChangeMock}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));
      await user.click(screen.getByText("Broccoli"));

      expect(onValueChangeMock).toHaveBeenCalledWith("broccoli");
    });
  });

  describe("Clearable Functionality", () => {
    it("should show clear button when isClearable and has value", async () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          defaultValue="apple"
          isClearable
          onValueChange={onValueChangeMock}
        />,
      );

      // X icon should be visible for clearing
      const trigger = screen.getByTestId("test-combobox");
      const clearButton = trigger.querySelector("svg.lucide-x");
      expect(clearButton).toBeInTheDocument();
    });

    it("should not show clear button when no value is selected", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          isClearable
          onValueChange={onValueChangeMock}
        />,
      );

      const trigger = screen.getByTestId("test-combobox");
      const clearButton = trigger.querySelector("svg.lucide-x");
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should clear selection when clear button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          defaultValue="apple"
          isClearable
          onValueChange={onValueChangeMock}
        />,
      );

      const trigger = screen.getByTestId("test-combobox");
      const clearButton = trigger.querySelector("svg.lucide-x");
      await user.click(clearButton!);

      expect(onValueChangeMock).toHaveBeenCalledWith(null);
    });

    it("should not show clear button when disabled", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          defaultValue="apple"
          isClearable
          disabled
        />,
      );

      const trigger = screen.getByTestId("test-combobox");
      const clearButton = trigger.querySelector("svg.lucide-x");
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe("Custom Value Input", () => {
    it("should show custom value option when allowsCustomValue is true", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          allowsCustomValue
          onValueChange={onValueChangeMock}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));

      // Type a custom value
      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "mango");

      // Should show "Use: mango" option
      expect(screen.getByText("Use:")).toBeInTheDocument();
      expect(screen.getByText("mango")).toBeInTheDocument();
    });

    it("should select custom value when clicked", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          allowsCustomValue
          onValueChange={onValueChangeMock}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));
      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "custom-fruit");

      // Click the custom value option
      await user.click(screen.getByText("custom-fruit"));

      expect(onValueChangeMock).toHaveBeenCalledWith("custom-fruit");
    });

    it("should not show custom option when value matches existing item", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          allowsCustomValue
          onValueChange={onValueChangeMock}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));
      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "apple");

      // Should not show "Use:" prefix for existing item
      expect(screen.queryByText("Use:")).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator when isLoading is true", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          isLoading
        />,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should be disabled when isLoading is true", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          isLoading
        />,
      );

      expect(screen.getByTestId("test-combobox")).toBeDisabled();
    });

    it("should not show loading indicator when isLoading is false", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          isLoading={false}
        />,
      );

      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          disabled
        />,
      );

      expect(screen.getByTestId("test-combobox")).toBeDisabled();
    });

    it("should not open dropdown when disabled", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          disabled
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));

      expect(screen.getByTestId("test-combobox")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  });

  describe("Search/Filtering", () => {
    it("should filter items based on search input", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          onInputChange={onInputChangeMock}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));
      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "ban");

      // Should show Banana, hide others (cmdk handles filtering)
      expect(onInputChangeMock).toHaveBeenCalledWith("b");
      expect(onInputChangeMock).toHaveBeenCalledWith("ba");
      expect(onInputChangeMock).toHaveBeenCalledWith("ban");
    });

    it("should show empty message when no items match", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          emptyMessage="No fruits found."
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));
      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "xyz123");

      expect(screen.getByText("No fruits found.")).toBeInTheDocument();
    });

    it("should use custom filter function when provided", async () => {
      const customFilter = vi.fn((textValue: string, inputValue: string) =>
        textValue.startsWith(inputValue),
      );
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          defaultFilter={customFilter}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));
      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "a");

      expect(customFilter).toHaveBeenCalled();
    });

    it("should use custom search placeholder", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          searchPlaceholder="Type to search..."
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));

      expect(screen.getByPlaceholderText("Type to search...")).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should open dropdown on Enter key", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
        />,
      );

      const trigger = screen.getByTestId("test-combobox");
      trigger.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("should toggle dropdown on Space key", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
        />,
      );

      const trigger = screen.getByTestId("test-combobox");
      trigger.focus();
      await user.keyboard(" ");

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });
  });

  describe("Form Submission", () => {
    it("should render hidden input with name and value for form submission", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          name="fruit-selection"
          defaultValue="banana"
        />,
      );

      const hiddenInput = document.querySelector(
        'input[type="hidden"][name="fruit-selection"]',
      );
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveValue("banana");
    });

    it("should update hidden input value when selection changes", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          name="fruit-selection"
          defaultValue="apple"
          onValueChange={onValueChangeMock}
        />,
      );

      await user.click(screen.getByTestId("test-combobox"));
      await user.click(screen.getByText("Cherry"));

      const hiddenInput = document.querySelector(
        'input[type="hidden"][name="fruit-selection"]',
      );
      expect(hiddenInput).toHaveValue("cherry");
    });

    it("should have empty hidden input value when cleared", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          name="fruit-selection"
          defaultValue="apple"
          isClearable
          onValueChange={onValueChangeMock}
        />,
      );

      const trigger = screen.getByTestId("test-combobox");
      const clearButton = trigger.querySelector("svg.lucide-x");
      await user.click(clearButton!);

      const hiddenInput = document.querySelector(
        'input[type="hidden"][name="fruit-selection"]',
      );
      expect(hiddenInput).toHaveValue("");
    });

    it("should not render hidden input when name is not provided", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          defaultValue="apple"
        />,
      );

      const hiddenInput = document.querySelector('input[type="hidden"]');
      expect(hiddenInput).not.toBeInTheDocument();
    });

    it("should set aria-required when required prop is true", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          required
        />,
      );

      expect(screen.getByTestId("test-combobox")).toHaveAttribute(
        "aria-required",
        "true",
      );
    });
  });

  describe("Start Content", () => {
    it("should render start content when provided", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          startContent={<span data-testid="start-icon">🍎</span>}
        />,
      );

      expect(screen.getByTestId("start-icon")).toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom trigger className", () => {
      render(
        <Combobox
          data-testid="test-combobox"
          items={mockItems}
          triggerClassName="custom-trigger-class"
        />,
      );

      expect(screen.getByTestId("test-combobox")).toHaveClass(
        "custom-trigger-class",
      );
    });
  });
});

