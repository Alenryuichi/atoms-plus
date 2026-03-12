import { cn } from "#/lib/utils";
import { ChatInterfaceWrapper } from "./chat-interface-wrapper";
import { ConversationTabContent } from "../conversation-tabs/conversation-tab-content/conversation-tab-content";
import { ResizeHandle } from "../../../ui/resize-handle";
import { useResizablePanels } from "#/hooks/use-resizable-panels";
import { useConversationStore } from "#/stores/conversation-store";
import { useBreakpoint } from "#/hooks/use-breakpoint";
import { useAutoPreview } from "#/hooks/use-auto-preview";

function getMobileChatPanelClass(isRightPanelShown: boolean) {
  return isRightPanelShown ? "min-h-[15rem] flex-[0_0_42%]" : "flex-1";
}

function getDesktopTabPanelClass(isRightPanelShown: boolean) {
  return isRightPanelShown
    ? "translate-x-0 opacity-100"
    : "w-0 translate-x-full opacity-0";
}

export function ConversationMain() {
  const isMobile = useBreakpoint();
  const { isRightPanelShown, isChatPanelCollapsed } = useConversationStore();

  // Auto-switch to App (served) tab when agent finishes with web files
  useAutoPreview();

  // Panel width state is now in Zustand store, synchronized with TopNavbar
  const { leftWidth, rightWidth, isDragging, containerRef, handleMouseDown } =
    useResizablePanels();

  // When chat panel is collapsed, preview takes full width
  const effectiveLeftWidth = isChatPanelCollapsed ? 0 : leftWidth;
  const effectiveRightWidth = isChatPanelCollapsed ? 100 : rightWidth;

  return (
    <div
      className={cn(
        // Atoms Plus: Transparent background - let parent background show through
        "bg-transparent",
        // Use flex-1 min-h-0 for proper height inheritance in flex containers
        isMobile
          ? "relative flex-1 flex flex-col min-h-0"
          : "flex-1 flex flex-col overflow-hidden min-h-0",
      )}
    >
      <div
        ref={containerRef}
        className={cn(
          "flex flex-1 min-h-0 overflow-hidden",
          isMobile
            ? "flex-col pt-3"
            : "transition-all duration-300 ease-in-out pt-0",
        )}
        style={
          !isMobile
            ? { transitionProperty: isDragging ? "none" : "all" }
            : undefined
        }
      >
        {/* Chat Panel - Left side, collapsible */}
        <div
          className={cn(
            "flex flex-col min-h-0 overflow-hidden",
            isMobile
              ? getMobileChatPanelClass(isRightPanelShown)
              : "transition-all duration-300 ease-in-out",
            // Hide when collapsed (desktop only)
            !isMobile && isChatPanelCollapsed && "w-0 opacity-0",
          )}
          style={
            !isMobile
              ? {
                  flexGrow: isRightPanelShown ? effectiveLeftWidth : 1,
                  flexShrink: 1,
                  flexBasis: 0,
                  transitionProperty: isDragging ? "none" : "all",
                }
              : undefined
          }
        >
          <ChatInterfaceWrapper
            isRightPanelShown={!isMobile && isRightPanelShown}
          />
        </div>

        {/* Resize Handle - thin and subtle, hidden when chat is collapsed */}
        {!isMobile && isRightPanelShown && !isChatPanelCollapsed && (
          <ResizeHandle onMouseDown={handleMouseDown} />
        )}

        {/* Tab Content Panel - Right side, expands fully when chat is collapsed */}
        <div
          className={cn(
            "flex flex-col min-h-0 transition-all duration-300 ease-in-out overflow-hidden",
            isMobile
              ? cn(
                  "min-h-0",
                  isRightPanelShown
                    ? "relative mt-3 flex-1 translate-y-0 opacity-100"
                    : "pointer-events-none absolute inset-x-0 bottom-0 top-full translate-y-4 opacity-0",
                )
              : getDesktopTabPanelClass(isRightPanelShown),
          )}
          style={
            !isMobile
              ? {
                  flexGrow: isRightPanelShown ? effectiveRightWidth : 0,
                  flexShrink: 1,
                  flexBasis: 0,
                  transitionProperty: isDragging ? "opacity, transform" : "all",
                }
              : undefined
          }
        >
          <div className="flex flex-col flex-1 min-h-0 h-full">
            <ConversationTabContent />
          </div>
        </div>
      </div>
    </div>
  );
}
