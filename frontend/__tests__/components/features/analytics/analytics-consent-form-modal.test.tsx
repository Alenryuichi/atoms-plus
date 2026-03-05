import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsConsentFormModal } from "#/components/features/analytics/analytics-consent-form-modal";
import SettingsService from "#/api/settings-service/settings-service.api";

describe("AnalyticsConsentFormModal", () => {
  const renderModal = (onClose = vi.fn()) => {
    const user = userEvent.setup();
    render(<AnalyticsConsentFormModal onClose={onClose} />, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={new QueryClient()}>
          {children}
        </QueryClientProvider>
      ),
    });
    return { user, onClose };
  };

  it("should call saveUserSettings with consent enabled by default", async () => {
    const saveUserSettingsSpy = vi.spyOn(SettingsService, "saveSettings");
    const { user, onClose } = renderModal();

    const confirmButton = screen.getByTestId("confirm-preferences");
    await user.click(confirmButton);

    expect(saveUserSettingsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ user_consents_to_analytics: true }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("should call saveUserSettings with consent disabled when toggled off", async () => {
    const saveUserSettingsSpy = vi.spyOn(SettingsService, "saveSettings");
    const { user, onClose } = renderModal();

    // Find and click the switch toggle
    const switchButton = screen.getByRole("switch");
    expect(switchButton).toHaveAttribute("aria-checked", "true");

    await user.click(switchButton);
    expect(switchButton).toHaveAttribute("aria-checked", "false");

    const confirmButton = screen.getByTestId("confirm-preferences");
    await user.click(confirmButton);

    expect(saveUserSettingsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ user_consents_to_analytics: false }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("should have proper accessibility attributes", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");

    const switchButton = screen.getByRole("switch");
    expect(switchButton).toHaveAttribute("aria-checked");
    expect(switchButton).toHaveAttribute("aria-label");
  });
});
