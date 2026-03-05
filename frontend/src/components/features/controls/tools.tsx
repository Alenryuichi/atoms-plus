import React from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import ToolsIcon from "#/icons/tools.svg?react";
import ChevronDownSmallIcon from "#/icons/chevron-down-small.svg?react";
import { ToolsContextMenu } from "./tools-context-menu";
import { useConversationNameContextMenu } from "#/hooks/use-conversation-name-context-menu";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { SystemMessageModal } from "../conversation-panel/system-message-modal";
import { SkillsModal } from "../conversation-panel/skills-modal";
import { cn } from "#/utils/utils";

export function Tools() {
  const { t } = useTranslation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: conversation } = useActiveConversation();
  const [contextMenuOpen, setContextMenuOpen] = React.useState(false);

  const {
    handleShowAgentTools,
    handleShowSkills,
    systemModalVisible,
    setSystemModalVisible,
    skillsModalVisible,
    setSkillsModalVisible,
    systemMessage,
    shouldShowAgentTools,
  } = useConversationNameContextMenu({
    conversationId,
    conversationStatus: conversation?.status,
    showOptions: true, // Enable all options for conversation name
    onContextMenuToggle: setContextMenuOpen,
  });

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuOpen(!contextMenuOpen);
  };

  return (
    <div className="relative">
      {/* Atoms Plus: Unified button style with Code button */}
      <button
        type="button"
        className={cn(
          // Match ChangeAgentButton style exactly
          "flex items-center gap-1 px-2.5 py-1.5 rounded-full",
          "bg-black/30 border border-white/10",
          "hover:border-amber-500/30 hover:bg-black/40",
          "transition-all duration-200 cursor-pointer",
        )}
        onClick={handleClick}
      >
        <ToolsIcon width={16} height={16} className="text-amber-500/70" />
        <span className="text-sm font-medium text-neutral-300">
          {t(I18nKey.MICROAGENTS_MODAL$TOOLS)}
        </span>
        <ChevronDownSmallIcon width={18} height={18} color="#a3a3a3" />
      </button>
      {contextMenuOpen && (
        <ToolsContextMenu
          onClose={() => setContextMenuOpen(false)}
          onShowSkills={handleShowSkills}
          onShowAgentTools={handleShowAgentTools}
          shouldShowAgentTools={shouldShowAgentTools}
        />
      )}

      {/* System Message Modal */}
      <SystemMessageModal
        isOpen={systemModalVisible}
        onClose={() => setSystemModalVisible(false)}
        systemMessage={systemMessage || null}
      />

      {/* Skills Modal */}
      {skillsModalVisible && (
        <SkillsModal onClose={() => setSkillsModalVisible(false)} />
      )}
    </div>
  );
}
