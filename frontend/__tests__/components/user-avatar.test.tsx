import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserAvatar } from "#/components/features/sidebar/user-avatar";

describe("UserAvatar", () => {
  const onClickMock = vi.fn();

  afterEach(() => {
    onClickMock.mockClear();
    // Clear localStorage between tests
    localStorage.clear();
  });

  it("(default) should render a Boring Avatar when the user is logged out", () => {
    render(<UserAvatar onClick={onClickMock} />);
    expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
    // Boring Avatar renders as SVG
    const button = screen.getByTestId("user-avatar");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const user = userEvent.setup();
    render(<UserAvatar onClick={onClickMock} />);

    const userAvatarContainer = screen.getByTestId("user-avatar");
    await user.click(userAvatarContainer);

    expect(onClickMock).toHaveBeenCalledOnce();
  });

  it("should display the user's avatar when available", () => {
    render(
      <UserAvatar
        onClick={onClickMock}
        avatarUrl="https://example.com/avatar.png"
      />,
    );

    expect(screen.getByAltText("AVATAR$ALT_TEXT")).toBeInTheDocument();
    // When real avatar is available, no Boring Avatar should render
    const button = screen.getByTestId("user-avatar");
    expect(button.querySelector("svg")).not.toBeInTheDocument();
  });

  it("should display a Boring Avatar when userEmail is provided but no avatarUrl", () => {
    render(
      <UserAvatar
        onClick={onClickMock}
        userEmail="test@example.com"
      />,
    );

    const button = screen.getByTestId("user-avatar");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("should display a loading spinner instead of an avatar when isLoading is true", () => {
    const { rerender } = render(<UserAvatar onClick={onClickMock} />);
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    // Boring Avatar should be rendered when not loading
    const button = screen.getByTestId("user-avatar");
    expect(button.querySelector("svg")).toBeInTheDocument();

    rerender(<UserAvatar onClick={onClickMock} isLoading />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    // No avatar when loading
    const buttonLoading = screen.getByTestId("user-avatar");
    expect(buttonLoading.querySelector("svg")).not.toBeInTheDocument();

    rerender(
      <UserAvatar
        onClick={onClickMock}
        avatarUrl="https://example.com/avatar.png"
        isLoading
      />,
    );
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByAltText("AVATAR$ALT_TEXT")).not.toBeInTheDocument();
  });

  it("should generate consistent guest seeds from localStorage", () => {
    // First render should create a seed in localStorage
    const { rerender } = render(<UserAvatar onClick={onClickMock} />);
    const seed1 = localStorage.getItem("atoms-guest-avatar-seed");
    expect(seed1).toBeTruthy();
    expect(seed1).toMatch(/^guest-/);

    // Rerender should use the same seed
    rerender(<UserAvatar onClick={onClickMock} />);
    const seed2 = localStorage.getItem("atoms-guest-avatar-seed");
    expect(seed2).toBe(seed1);
  });
});
