import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { DarkVeil } from "#/components/ui/dark-veil";

// Mock WebGL context
const mockLoseContext = vi.fn();
const mockGetExtension = vi.fn().mockReturnValue({
  loseContext: mockLoseContext,
});

const mockGl = {
  getExtension: mockGetExtension,
  canvas: document.createElement("canvas"),
  drawingBufferWidth: 100,
  drawingBufferHeight: 100,
};

// Mock ogl module
vi.mock("ogl", () => ({
  Renderer: vi.fn().mockImplementation(() => ({
    gl: mockGl,
    setSize: vi.fn(),
    render: vi.fn(),
  })),
  Program: vi.fn().mockImplementation(() => ({
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: { set: vi.fn() } },
      uHueShift: { value: 0 },
      uNoise: { value: 0 },
      uScan: { value: 0 },
      uScanFreq: { value: 0 },
      uWarp: { value: 0 },
    },
  })),
  Mesh: vi.fn(),
  Triangle: vi.fn(),
  Vec2: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
  })),
}));

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

    // Run any pending animation frames
    vi.runAllTimers();

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

