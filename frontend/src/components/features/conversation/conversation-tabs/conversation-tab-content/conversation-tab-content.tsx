import { lazy, useMemo, Suspense } from "react";
import { ConversationLoading } from "../../conversation-loading";
import { I18nKey } from "#/i18n/declaration";
import { TabWrapper } from "./tab-wrapper";
import { TabContainer } from "./tab-container";
import { TabContentArea } from "./tab-content-area";
import Terminal from "#/components/features/terminal/terminal";
import { useConversationStore } from "#/stores/conversation-store";
import { useConversationId } from "#/hooks/use-conversation-id";

// Lazy load all tab components
const EditorTab = lazy(() => import("#/routes/changes-tab"));
const BrowserTab = lazy(() => import("#/routes/browser-tab"));
const ServedTab = lazy(() => import("#/routes/served-tab"));
const VSCodeTab = lazy(() => import("#/routes/vscode-tab"));
const PlannerTab = lazy(() => import("#/routes/planner-tab"));
const PreviewTab = lazy(() => import("#/routes/preview-tab"));

const TAB_CONFIG = {
  editor: {
    component: EditorTab,
    titleKey: I18nKey.COMMON$CHANGES,
  },
  browser: {
    component: BrowserTab,
    titleKey: I18nKey.COMMON$BROWSER,
  },
  served: {
    component: ServedTab,
    titleKey: I18nKey.COMMON$APP,
  },
  vscode: {
    component: VSCodeTab,
    titleKey: I18nKey.COMMON$CODE,
  },
  terminal: {
    component: Terminal,
    titleKey: I18nKey.COMMON$TERMINAL,
  },
  planner: {
    component: PlannerTab,
    titleKey: I18nKey.COMMON$PLANNER,
  },
  preview: {
    component: PreviewTab,
    titleKey: I18nKey.COMMON$PREVIEW,
  },
};

export function ConversationTabContent() {
  const { selectedTab, shouldShownAgentLoading } = useConversationStore();
  const { conversationId } = useConversationId();

  const activeTab = useMemo(
    () => TAB_CONFIG[selectedTab ?? "editor"],
    [selectedTab],
  );

  const ActiveComponent = activeTab.component;

  if (shouldShownAgentLoading) {
    return <ConversationLoading className="rounded-xl" />;
  }

  return (
    <TabContainer>
      {/* Internal title bar removed - tabs are now in TopNavbar */}
      <Suspense fallback={<ConversationLoading />}>
        <TabContentArea>
          <TabWrapper
            // Force Terminal remount to reset XTerm buffer/state
            key={
              selectedTab === "terminal"
                ? `${selectedTab}-${conversationId}`
                : selectedTab
            }
          >
            <ActiveComponent />
          </TabWrapper>
        </TabContentArea>
      </Suspense>
    </TabContainer>
  );
}
