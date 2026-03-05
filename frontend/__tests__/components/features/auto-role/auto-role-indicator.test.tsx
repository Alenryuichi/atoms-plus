import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../../test-utils";
import { AutoRoleIndicator } from "#/components/features/auto-role/auto-role-indicator";
import * as roleService from "#/api/role-service/role-service.api";

vi.mock("#/api/role-service/role-service.api", () => ({
  autoDetectRole: vi.fn(),
}));

describe("AutoRoleIndicator", () => {
  const mockAutoDetectRole = vi.mocked(roleService.autoDetectRole);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default role (Bob)", () => {
    renderWithProviders(<AutoRoleIndicator />);

    expect(screen.getByTestId("auto-role-indicator")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("displays role name in non-detailed mode", () => {
    renderWithProviders(<AutoRoleIndicator showDetails={false} />);

    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("displays role name and title in detailed mode", () => {
    renderWithProviders(<AutoRoleIndicator showDetails />);

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
  });

  it("calls autoDetectRole when userInput changes", async () => {
    const mockRole = {
      role_id: "architect",
      role_name: "Alex",
      role_title: "Software Architect",
      avatar: "🏗️",
      confidence: 0.9,
      matched_keywords: ["design", "architecture"],
      reason: "Architecture-related query",
      system_prompt: "",
    };

    mockAutoDetectRole.mockResolvedValue(mockRole);

    const { rerender } = renderWithProviders(
      <AutoRoleIndicator userInput="design the system architecture" />,
    );

    // Wait for debounce + API call
    await waitFor(
      () => {
        expect(mockAutoDetectRole).toHaveBeenCalledWith(
          "design the system architecture",
        );
      },
      { timeout: 1000 },
    );

    // Verify role changed
    await waitFor(() => {
      expect(screen.getByText("Alex")).toBeInTheDocument();
    });
  });

  it("calls onRoleChange callback when role is detected", async () => {
    const mockRole = {
      role_id: "pm",
      role_name: "Emma",
      role_title: "Product Manager",
      avatar: "📋",
      confidence: 0.85,
      matched_keywords: ["product", "requirements"],
      reason: "Product-related query",
      system_prompt: "",
    };

    mockAutoDetectRole.mockResolvedValue(mockRole);
    const onRoleChange = vi.fn();

    renderWithProviders(
      <AutoRoleIndicator
        userInput="define the product requirements"
        onRoleChange={onRoleChange}
      />,
    );

    await waitFor(
      () => {
        expect(onRoleChange).toHaveBeenCalledWith(mockRole);
      },
      { timeout: 1000 },
    );
  });

  it("does not call autoDetectRole for short inputs", async () => {
    renderWithProviders(<AutoRoleIndicator userInput="hi" />);

    // Wait a bit to ensure no call was made
    await new Promise((resolve) => {
      setTimeout(resolve, 600);
    });

    expect(mockAutoDetectRole).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    renderWithProviders(<AutoRoleIndicator className="custom-indicator" />);

    expect(screen.getByTestId("auto-role-indicator")).toHaveClass(
      "custom-indicator",
    );
  });

  it("handles API errors gracefully", async () => {
    mockAutoDetectRole.mockRejectedValue(new Error("API Error"));

    renderWithProviders(
      <AutoRoleIndicator userInput="test input that causes error" />,
    );

    await waitFor(
      () => {
        expect(mockAutoDetectRole).toHaveBeenCalled();
      },
      { timeout: 1000 },
    );

    // Should still show default role after error
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});

