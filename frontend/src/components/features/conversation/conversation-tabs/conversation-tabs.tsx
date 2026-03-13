import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import TerminalIcon from "#/icons/terminal.svg?react";
import ServerIcon from "#/icons/server.svg?react";
import GitChanges from "#/icons/git_changes.svg?react";
import ThreeDotsVerticalIcon from "#/icons/three-dots-vertical.svg?react";
import { cn } from "#/utils/utils";
import { useConversationLocalStorageState } from "#/utils/conversation-local-storage";
import { ConversationTabNav } from "./conversation-tab-nav";
import { ChatActionTooltip } from "../../chat/chat-action-tooltip";
import { I18nKey } from "#/i18n/declaration";
import { useConversationStore } from "#/stores/conversation-store";
import { ConversationTabsContextMenu } from "./conversation-tabs-context-menu";
import { useConversationId } from "#/hooks/use-conversation-id";
import { useSelectConversationTab } from "#/hooks/use-select-conversation-tab";
import ResearchIcon from "#/icons/lightbulb.svg?react";
import { useResearchStore } from "#/stores/research-store";

export function ConversationTabs() {
  const { conversationId } = useConversationId();
  const { setHasRightPanelToggled, setSelectedTab } = useConversationStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);

  const { state: persistedState } =
    useConversationLocalStorageState(conversationId);

  const {
    selectTab,
    isTabActive,
    onTabChange,
    selectedTab,
    isRightPanelShown,
  } = useSelectConversationTab();

  const researchReport = useConversationStore((s) => s.researchReport);
  const researchPhase = useResearchStore((s) => s.phase);
  const isResearchActive = researchPhase === "connecting" || researchPhase === "researching" || researchPhase === "awaiting_confirmation" || researchPhase === "error";

  // Initialize Zustand state from localStorage on component mount
  useEffect(() => {
    setSelectedTab(persistedState.selectedTab);
    setHasRightPanelToggled(persistedState.rightPanelShown);
  }, [
    setSelectedTab,
    setHasRightPanelToggled,
    persistedState.selectedTab,
    persistedState.rightPanelShown,
  ]);

  useEffect(() => {
    const handlePanelVisibilityChange = () => {
      if (isRightPanelShown) {
        if (!selectedTab) {
          onTabChange("editor");
        }
      }
    };

    handlePanelVisibilityChange();
  }, [isRightPanelShown, selectedTab, onTabChange]);

  const { t } = useTranslation();

  const tabs = [
    ...(researchReport || isResearchActive
      ? [
          {
            tabValue: "research",
            isActive: isTabActive("research"),
            icon: ResearchIcon,
            onClick: () => selectTab("research"),
            tooltipContent: t(I18nKey.ATOMS$RESEARCH_TITLE),
            tooltipAriaLabel: t(I18nKey.ATOMS$RESEARCH_TITLE),
            label: t(I18nKey.ATOMS$RESEARCH_TITLE),
            className: "text-amber-400",
          },
        ]
      : []),
    {
      tabValue: "editor",
      isActive: isTabActive("editor"),
      icon: GitChanges,
      onClick: () => selectTab("editor"),
      tooltipContent: t(I18nKey.COMMON$CHANGES),
      tooltipAriaLabel: t(I18nKey.COMMON$CHANGES),
      label: t(I18nKey.COMMON$CHANGES),
    },
    {
      tabValue: "served",
      isActive: isTabActive("served"),
      icon: ServerIcon,
      onClick: () => selectTab("served"),
      tooltipContent: t(I18nKey.COMMON$APP),
      tooltipAriaLabel: t(I18nKey.COMMON$APP),
      label: t(I18nKey.COMMON$APP),
    },
    {
      tabValue: "terminal",
      isActive: isTabActive("terminal"),
      icon: TerminalIcon,
      onClick: () => selectTab("terminal"),
      tooltipContent: t(I18nKey.COMMON$TERMINAL),
      tooltipAriaLabel: t(I18nKey.COMMON$TERMINAL),
      label: t(I18nKey.COMMON$TERMINAL),
    },
  ];

  // Filter out unpinned tabs
  const visibleTabs = tabs.filter(
    (tab) => !persistedState.unpinnedTabs.includes(tab.tabValue),
  );

  const handleTabKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (visibleTabs.length === 0) return;

    const getNextIndex = () => {
      switch (event.key) {
        case "ArrowRight":
          return (index + 1) % visibleTabs.length;
        case "ArrowLeft":
          return (index - 1 + visibleTabs.length) % visibleTabs.length;
        case "Home":
          return 0;
        case "End":
          return visibleTabs.length - 1;
        default:
          return null;
      }
    };

    const nextIndex = getNextIndex();
    if (nextIndex === null) return;

    event.preventDefault();
    visibleTabs[nextIndex].onClick();

    const tabsElements = tabListRef.current?.querySelectorAll('[role="tab"]');
    const nextTab = tabsElements?.[nextIndex] as HTMLButtonElement | undefined;
    nextTab?.focus();
  };

  return (
    <div className="relative flex min-w-0 items-center gap-2">
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Conversation panels"
        className={cn(
          "relative flex min-w-0 flex-1 flex-row items-center justify-start gap-2 overflow-x-auto",
        )}
      >
        {visibleTabs.map(
          (
            {
              tabValue,
              icon,
              onClick,
              isActive,
              tooltipContent,
              tooltipAriaLabel,
              label,
              className,
            },
            index,
          ) => (
            <ChatActionTooltip
              key={index}
              tooltip={tooltipContent}
              ariaLabel={tooltipAriaLabel}
            >
              <ConversationTabNav
                id={`conversation-tab-${tabValue}`}
                tabValue={tabValue}
                icon={icon}
                onClick={onClick}
                onKeyDown={(event) => handleTabKeyDown(index, event)}
                isActive={isActive}
                label={label}
                ariaLabel={tooltipAriaLabel}
                panelId="conversation-tab-panel"
                className={className}
              />
            </ChatActionTooltip>
          ),
        )}
      </div>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={cn(
            "flex size-8 items-center justify-center cursor-pointer text-white/40 transition-colors duration-150 hover:text-white/85",
          )}
          aria-label={t(I18nKey.COMMON$MORE_OPTIONS)}
        >
          <ThreeDotsVerticalIcon className={cn("w-5 h-5 text-inherit")} />
        </button>
        <ConversationTabsContextMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      </div>
    </div>
  );
}
