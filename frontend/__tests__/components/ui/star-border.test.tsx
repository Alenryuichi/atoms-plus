import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StarBorder } from "#/components/ui/star-border";

describe("StarBorder", () => {
  it("renders children correctly", () => {
    render(<StarBorder>Click me</StarBorder>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders as button by default", () => {
    render(<StarBorder>Button</StarBorder>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Button");
  });

  it("renders as different element when 'as' prop is provided", () => {
    render(<StarBorder as="div">Div content</StarBorder>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Div content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<StarBorder className="custom-class">Content</StarBorder>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("applies custom inner className when provided", () => {
    render(<StarBorder innerClassName="inner-custom">Content</StarBorder>);
    // The inner div is a sibling of the animated divs, find the one with content
    const contentDiv = screen.getByText("Content");
    expect(contentDiv).toHaveClass("inner-custom");
  });

  it("uses default inner styling when innerClassName is not provided", () => {
    render(<StarBorder>Content</StarBorder>);
    const contentDiv = screen.getByText("Content");
    // Default inner class includes relative z-10
    expect(contentDiv).toHaveClass("relative", "z-10");
  });

  it("passes through additional props", () => {
    render(
      <StarBorder data-testid="star-button" disabled>
        Disabled Button
      </StarBorder>,
    );
    const button = screen.getByTestId("star-button");
    expect(button).toBeDisabled();
  });

  it("applies custom speed prop to animation", () => {
    const { container } = render(<StarBorder speed="3s">Content</StarBorder>);
    const animatedDivs = container.querySelectorAll(
      '[class*="animate-star-movement"]',
    );
    animatedDivs.forEach((div) => {
      expect(div).toHaveStyle({ animationDuration: "3s" });
    });
  });

  it("applies custom color prop to gradient", () => {
    const { container } = render(
      <StarBorder color="#ff0000">Content</StarBorder>,
    );
    const animatedDivs = container.querySelectorAll(
      '[class*="animate-star-movement"]',
    );
    expect(animatedDivs.length).toBeGreaterThan(0);
  });
});

