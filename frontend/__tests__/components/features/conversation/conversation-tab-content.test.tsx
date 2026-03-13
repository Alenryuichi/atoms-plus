import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { ConversationTabContent } from "#/components/features/conversation/conversation-tabs/conversation-tab-content/conversation-tab-content";
import {
  useConversationStore,
  ConversationTab,
} from "#/stores/conversation-store";

// Mock useConversationId hook
let mockConversationId = "test-conversation-id-123";
vi.mock("#/hooks/use-conversation-id", () => ({
  useConversationId: () => ({
    conversationId: mockConversationId,
  }),
}));

// Mock useUnifiedGetGitChanges hook (used by ConversationTabTitle)
vi.mock("#/hooks/query/use-unified-get-git-changes", () => ({
  useUnifiedGetGitChanges: () => ({
    refetch: vi.fn(),
    data: [],
    isLoading: false,
  }),
}));

// Mock lazy-loaded components
vi.mock("#/routes/changes-tab", () => ({
  default: () => <div data-testid="editor-tab-content">Editor Tab Content</div>,
}));

vi.mock("#/routes/served-tab", () => ({
  default: () => (
    <div data-testid="served-tab-content">Served Tab Content</div>
  ),
}));

// Control for lazy loading test
let pendingResearchTab: { promise: Promise<void>; resolve: () => void } | null = null;
vi.mock("#/routes/research-tab", () => ({
  default: () => {
    if (pendingResearchTab) {
      throw pendingResearchTab.promise;
    }
    return <div data-testid="research-tab-content">Research Tab Content</div>;
  },
}));

vi.mock("#/components/features/terminal/terminal", () => ({
  default: () => (
    <div data-testid="terminal-tab-content">Terminal Tab Content</div>
  ),
}));

// Mock ConversationLoading component
vi.mock("#/components/features/conversation/conversation-loading", () => ({
  ConversationLoading: () => (
    <div data-testid="conversation-loading">Loading...</div>
  ),
}));

describe("ConversationTabContent", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={["/conversations/test-conversation-id"]}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MemoryRouter>
    );
  };

  const setSelectedTab = (tab: ConversationTab | null) => {
    useConversationStore.setState({ selectedTab: tab });
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    // Reset store state
    useConversationStore.setState({ selectedTab: "editor" });
    // Reset conversation ID
    mockConversationId = "test-conversation-id-123";
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe("Rendering", () => {
    it("should render the container with correct structure", async () => {
      render(<ConversationTabContent />, { wrapper: createWrapper() });

      // Should show the title for the default tab (editor -> COMMON$CHANGES)
      await waitFor(() => {
        expect(screen.getByText("COMMON$CHANGES")).toBeInTheDocument();
      });
    });

    it("should render editor tab content by default", async () => {
      setSelectedTab("editor");

      render(<ConversationTabContent />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("editor-tab-content")).toBeInTheDocument();
      });

      expect(screen.getByText("COMMON$CHANGES")).toBeInTheDocument();
    });

    it("should render editor tab when selectedTab is null", async () => {
      setSelectedTab(null);

      render(<ConversationTabContent />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("editor-tab-content")).toBeInTheDocument();
      });

      expect(screen.getByText("COMMON$CHANGES")).toBeInTheDocument();
    });
  });

  describe("Tab switching", () => {
    it("should render served tab when selected", async () => {
      setSelectedTab("served");

      render(<ConversationTabContent />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("served-tab-content")).toBeInTheDocument();
      });

      expect(screen.getByText("COMMON$APP")).toBeInTheDocument();
    });

    it("should render terminal tab when selected", async () => {
      setSelectedTab("terminal");

      render(<ConversationTabContent />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("terminal-tab-content")).toBeInTheDocument();
      });

      expect(screen.getByText("COMMON$TERMINAL")).toBeInTheDocument();
    });

  });

  describe("Title display", () => {
    const tabTitleMapping: Array<{
      tab: ConversationTab;
      expectedTitle: string;
    }> = [
        { tab: "editor", expectedTitle: "COMMON$CHANGES" },
        { tab: "served", expectedTitle: "COMMON$APP" },
        { tab: "terminal", expectedTitle: "COMMON$TERMINAL" },
        { tab: "research", expectedTitle: "ATOMS$RESEARCH_TITLE" },
      ];

    tabTitleMapping.forEach(({ tab, expectedTitle }) => {
      it(`should display "${expectedTitle}" title for "${tab}" tab`, async () => {
        setSelectedTab(tab);

        render(<ConversationTabContent />, { wrapper: createWrapper() });

        await waitFor(() => {
          expect(screen.getByText(expectedTitle)).toBeInTheDocument();
        });
      });
    });
  });

  describe("Tab key behavior", () => {
    it("should remount terminal when conversation ID changes", async () => {
      setSelectedTab("terminal");

      const { rerender } = render(<ConversationTabContent />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId("terminal-tab-content")).toBeInTheDocument();
      });

      // Get reference to the terminal DOM node
      const terminalBefore = screen.getByTestId("terminal-tab-content");

      // Change conversation ID
      mockConversationId = "test-conversation-id-456";

      // Rerender to pick up the new conversation ID
      rerender(<ConversationTabContent />);

      await waitFor(() => {
        expect(screen.getByTestId("terminal-tab-content")).toBeInTheDocument();
      });

      // Get new reference
      const terminalAfter = screen.getByTestId("terminal-tab-content");

      // If key includes conversation ID, component should remount = different DOM node
      expect(terminalBefore).not.toBe(terminalAfter);
    });

    it("should NOT remount non-terminal tabs when conversation ID changes", async () => {
      setSelectedTab("served");

      const { rerender } = render(<ConversationTabContent />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId("served-tab-content")).toBeInTheDocument();
      });

      // Get reference to the served DOM node
      const servedBefore = screen.getByTestId("served-tab-content");

      // Change conversation ID
      mockConversationId = "test-conversation-id-789";

      // Rerender
      rerender(<ConversationTabContent />);

      await waitFor(() => {
        expect(screen.getByTestId("served-tab-content")).toBeInTheDocument();
      });

      // Get new reference
      const servedAfter = screen.getByTestId("served-tab-content");

      // If key does NOT include conversation ID, component should NOT remount = same DOM node
      expect(servedBefore).toBe(servedAfter);
    });
  });

  describe("Lazy loading", () => {
    afterEach(() => {
      pendingResearchTab = null;
    });

    it("should show loading fallback while component is loading", async () => {
      let resolveFn: () => void;
      pendingResearchTab = {
        promise: new Promise<void>((resolve) => {
          resolveFn = resolve;
        }),
        resolve: () => {
          pendingResearchTab = null; // Clear first so re-render doesn't throw again
          resolveFn();
        },
      };

      setSelectedTab("research");

      render(<ConversationTabContent />, { wrapper: createWrapper() });

      // Verify loading fallback is shown
      expect(screen.getByTestId("conversation-loading")).toBeInTheDocument();

      // Resolve to load the component
      pendingResearchTab!.resolve();

      // Verify content appears
      await waitFor(() => {
        expect(screen.getByTestId("research-tab-content")).toBeInTheDocument();
      });
    });
  });

  describe("Tab state persistence", () => {
    it("should render content based on store state", async () => {
      // First render with editor tab
      setSelectedTab("editor");

      const { rerender } = render(<ConversationTabContent />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId("editor-tab-content")).toBeInTheDocument();
      });

      // Change the store state
      setSelectedTab("terminal");

      // Rerender
      rerender(<ConversationTabContent />);

      await waitFor(() => {
        expect(screen.getByTestId("terminal-tab-content")).toBeInTheDocument();
      });
    });
  });

  describe("Suspense boundary", () => {
    it("should wrap tab content in Suspense boundary", async () => {
      setSelectedTab("editor");

      render(<ConversationTabContent />, { wrapper: createWrapper() });

      // The component should render without throwing
      await waitFor(() => {
        expect(screen.getByTestId("editor-tab-content")).toBeInTheDocument();
      });
    });
  });
});
