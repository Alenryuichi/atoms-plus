import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "#/mocks/node";
import "@testing-library/jest-dom/vitest";

// =============================================================================
// EARLY INITIALIZATION: Must happen before any module imports that use these APIs
// =============================================================================

// Mock localStorage and sessionStorage BEFORE any module imports
// (Zustand stores are created at module load time and need localStorage)
const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
};

// Stub storage immediately (before any other imports might use them)
const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("sessionStorage", sessionStorageMock);

// =============================================================================
// Browser API Mocks
// =============================================================================

// Mock browser APIs not available in jsdom
HTMLCanvasElement.prototype.getContext = vi.fn();
HTMLElement.prototype.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();

// Mock window.getComputedStyle for motion-dom/framer-motion
// This needs to handle cases where elements are not in the document
if (typeof window.getComputedStyle === "function") {
  const originalGetComputedStyle = window.getComputedStyle.bind(window);
  Object.defineProperty(window, "getComputedStyle", {
    value: (element: Element, pseudoElt?: string | null) => {
      try {
        return originalGetComputedStyle(element, pseudoElt);
      } catch {
        // Return a minimal CSSStyleDeclaration mock for elements not in the document
        return {
          getPropertyValue: () => "",
          length: 0,
        } as unknown as CSSStyleDeclaration;
      }
    },
    writable: true,
    configurable: true,
  });
}

// Mock ResizeObserver for test environment
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Mock the i18n provider
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      exists: () => false,
    },
  }),
}));

vi.mock("#/hooks/use-is-on-tos-page", () => ({
  useIsOnTosPage: () => false,
}));

vi.mock("#/hooks/use-is-on-intermediate-page", () => ({
  useIsOnIntermediatePage: () => false,
}));

// Mock framer-motion to avoid animation cleanup issues in tests
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const actual =
    await vi.importActual<typeof import("framer-motion")>("framer-motion");

  // Helper to filter out motion-specific props
  const filterMotionProps = (props: Record<string, unknown>) => {
    const {
      initial,
      animate,
      exit,
      variants,
      transition,
      whileHover,
      whileTap,
      whileFocus,
      whileInView,
      layout,
      layoutId,
      ...domProps
    } = props;
    return domProps;
  };

  // Create a motion component wrapper
  const createMotionComponent = (tag: string) => {
    const Component = React.forwardRef(
      (
        {
          children,
          ...props
        }: React.PropsWithChildren<Record<string, unknown>>,
        ref,
      ) => {
        const domProps = filterMotionProps(props);
        return React.createElement(tag, { ...domProps, ref }, children);
      },
    );
    Component.displayName = `motion.${tag}`;
    return Component;
  };

  return {
    ...actual,
    motion: {
      div: createMotionComponent("div"),
      span: createMotionComponent("span"),
      button: createMotionComponent("button"),
      ul: createMotionComponent("ul"),
      li: createMotionComponent("li"),
      p: createMotionComponent("p"),
      a: createMotionComponent("a"),
      section: createMotionComponent("section"),
      article: createMotionComponent("article"),
      header: createMotionComponent("header"),
      footer: createMotionComponent("footer"),
      nav: createMotionComponent("nav"),
      aside: createMotionComponent("aside"),
      main: createMotionComponent("main"),
      form: createMotionComponent("form"),
      input: createMotionComponent("input"),
      textarea: createMotionComponent("textarea"),
      img: createMotionComponent("img"),
      svg: createMotionComponent("svg"),
      path: createMotionComponent("path"),
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
  };
});

// Import the Zustand mock to enable automatic store resets
vi.mock("zustand");

// Mock requests during tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" });
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  // Note: localStorage/sessionStorage are stubbed at the top of this file
});
afterEach(() => {
  server.resetHandlers();
  // Cleanup the document body after each test
  cleanup();
  // Clear storage between tests
  localStorage.clear();
  sessionStorage.clear();
});
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
