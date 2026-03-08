import { useState } from "react";
import { createPortal } from "react-dom";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { SystemMessageHeader } from "./system-message-modal/system-message-header";
import { TabNavigation } from "./system-message-modal/tab-navigation";
import { TabContent } from "./system-message-modal/tab-content";
import { SystemMessageForModal } from "#/utils/system-message-adapter";

interface SystemMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemMessage: SystemMessageForModal | null;
}

export function SystemMessageModal({
  isOpen,
  onClose,
  systemMessage,
}: SystemMessageModalProps) {
  const [activeTab, setActiveTab] = useState<"system" | "tools">("system");
  const [expandedTools, setExpandedTools] = useState<Record<number, boolean>>(
    {},
  );

  if (!isOpen || !systemMessage) {
    return null;
  }

  const toggleTool = (index: number) => {
    setExpandedTools((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Use portal to render modal at document body level to avoid CSS stacking context issues
  return createPortal(
    <ModalBackdrop onClose={onClose}>
      {/* Refined modal container with flat dark aesthetic */}
      <div className="w-[90vw] max-w-[700px] max-h-[70vh] flex flex-col bg-[#0a0b0d] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header section - compact */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-white/5">
          <SystemMessageHeader
            agentClass={systemMessage.agent_class}
            openhandsVersion={systemMessage.openhands_version}
          />
        </div>

        {/* Tab navigation - compact */}
        <div className="flex-shrink-0 px-5 py-2 border-b border-white/5">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            hasTools={
              !!(systemMessage.tools && systemMessage.tools.length > 0)
            }
          />
        </div>

        {/* Content area with custom scrollbar - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 custom-scrollbar-always">
          <TabContent
            activeTab={activeTab}
            systemMessage={systemMessage}
            expandedTools={expandedTools}
            onToggleTool={toggleTool}
          />
        </div>
      </div>
    </ModalBackdrop>,
    document.body,
  );
}
