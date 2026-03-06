import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Mock ogl module with proper class implementations - must be before component import
vi.mock("ogl", () => {
  const mockSetFn = () => {};
  const mockGl = {
    getExtension: () => ({ loseContext: () => {} }),
    canvas: { width: 100, height: 100 },
    drawingBufferWidth: 100,
    drawingBufferHeight: 100,
  };

  return {
    Renderer: class MockRenderer {
      gl = mockGl;
      setSize() {}
      render() {}
    },
    Program: class MockProgram {
      uniforms = {
        uTime: { value: 0 },
        uResolution: { value: { set: mockSetFn } },
        uHueShift: { value: 0 },
        uNoise: { value: 0 },
        uScan: { value: 0 },
        uScanFreq: { value: 0 },
        uWarp: { value: 0 },
      };
    },
    Mesh: class MockMesh {},
    Triangle: class MockTriangle {},
    Vec2: class MockVec2 {
      set() {}
    },
  };
});

import { DarkVeil } from "#/components/ui/dark-veil";

describe("DarkVeil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders a canvas element", () => {
    const { container } = render(<DarkVeil />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("applies default className for positioning", () => {
    const { container } = render(<DarkVeil />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveClass("absolute", "inset-0", "pointer-events-none");
  });

  it("applies custom className", () => {
    const { container } = render(<DarkVeil className="custom-bg" />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveClass("custom-bg");
  });

  it("accepts hueShift prop", () => {
    const { container } = render(<DarkVeil hueShift={60} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("accepts noiseIntensity prop", () => {
    const { container } = render(<DarkVeil noiseIntensity={0.5} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("accepts scanlineIntensity prop", () => {
    const { container } = render(<DarkVeil scanlineIntensity={0.3} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("accepts speed prop", () => {
    const { container } = render(<DarkVeil speed={1.5} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("accepts resolutionScale prop", () => {
    const { container } = render(<DarkVeil resolutionScale={0.5} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("cleans up on unmount without errors", () => {
    const { unmount } = render(<DarkVeil />);

    // Advance a few timer ticks (not all, as RAF creates an infinite loop)
    vi.advanceTimersByTime(100);

    // Should unmount without throwing
    expect(() => unmount()).not.toThrow();
  });

  it("handles all props together", () => {
    const { container } = render(
      <DarkVeil
        hueShift={45}
        noiseIntensity={0.2}
        scanlineIntensity={0.1}
        scanlineFrequency={100}
        warpAmount={0.05}
        speed={0.8}
        resolutionScale={0.75}
        className="test-veil"
      />,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass("test-veil");
  });
});

