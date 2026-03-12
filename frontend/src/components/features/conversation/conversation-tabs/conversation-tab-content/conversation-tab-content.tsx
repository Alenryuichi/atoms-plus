import { lazy, useMemo, Suspense } from "react";
import { ConversationLoading } from "../../conversation-loading";
import { I18nKey } from "#/i18n/declaration";
import { TabWrapper } from "./tab-wrapper";
import { TabContainer } from "./tab-container";
import { TabContentArea } from "./tab-content-area";
import Terminal from "#/components/features/terminal/terminal";
import { useConversationStore } from "#/stores/conversation-store";
import { useConversationId } from "#/hooks/use-conversation-id";

const EditorTab = lazy(() => import("#/routes/changes-tab"));
const ServedTab = lazy(() => import("#/routes/served-tab"));

const TAB_CONFIG = {
  editor: {
    component: EditorTab,
    titleKey: I18nKey.COMMON$CHANGES,
  },
  served: {
    component: ServedTab,
    titleKey: I18nKey.COMMON$APP,
  },
  terminal: {
    component: Terminal,
    titleKey: I18nKey.COMMON$TERMINAL,
  },
};

export function ConversationTabContent() {
  const { selectedTab, shouldShownAgentLoading } = useConversationStore();
  const { conversationId } = useConversationId();

  const activeTab = useMemo(
    () => TAB_CONFIG[selectedTab ?? "editor"],
    [selectedTab],
  );
  const activeTabId = `conversation-tab-${selectedTab ?? "editor"}`;

  const ActiveComponent = activeTab.component;

  if (shouldShownAgentLoading) {
    return <ConversationLoading className="rounded-xl" />;
  }

  return (
    <TabContainer>
      <Suspense fallback={<ConversationLoading />}>
        <TabContentArea ariaLabelledBy={activeTabId}>
          <TabWrapper
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
