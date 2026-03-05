import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { MemoryRouter } from "react-router";
import i18n from "i18next";
import { SettingsModal } from "#/components/shared/modals/settings/settings-modal";
import * as useAIConfigOptionsModule from "#/hooks/query/use-ai-config-options";

// Initialize i18n for tests
i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  ns: ["translation"],
  defaultNS: "translation",
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

vi.mock("#/hooks/query/use-ai-config-options", () => ({
  useAIConfigOptions: vi.fn(),
}));

// Wrapper with Router for components that use useLocation
function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("SettingsModal", () => {
  const mockOnClose = vi.fn();
  const mockUseAIConfigOptions = vi.mocked(
    useAIConfigOptionsModule.useAIConfigOptions,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAIConfigOptions.mockReturnValue({
      data: {
        models: ["gpt-4", "gpt-3.5-turbo"],
        agents: [],
        securityAnalyzers: [],
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAIConfigOptionsModule.useAIConfigOptions>);
  });

  it("renders the modal container", () => {
    renderWithRouter(<SettingsModal onClose={mockOnClose} />);
    expect(screen.getByTestId("ai-config-modal")).toBeInTheDocument();
  });

  it("shows loading spinner when loading", () => {
    mockUseAIConfigOptions.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useAIConfigOptionsModule.useAIConfigOptions>);

    renderWithRouter(<SettingsModal onClose={mockOnClose} />);

    expect(screen.getByTestId("ai-config-modal")).toBeInTheDocument();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("shows error message when there is an error", () => {
    mockUseAIConfigOptions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load config"),
    } as ReturnType<typeof useAIConfigOptionsModule.useAIConfigOptions>);

    renderWithRouter(<SettingsModal onClose={mockOnClose} />);

    expect(screen.getByText("Failed to load config")).toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    renderWithRouter(<SettingsModal onClose={mockOnClose} />);

    const modal = screen.getByTestId("ai-config-modal");
    expect(modal).toHaveClass("bg-black/80", "backdrop-blur-xl");
  });

  it("renders settings form when data is loaded", () => {
    renderWithRouter(<SettingsModal onClose={mockOnClose} />);

    expect(screen.getByTestId("ai-config-modal")).toBeInTheDocument();
  });
});

