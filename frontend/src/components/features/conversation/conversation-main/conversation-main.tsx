import { cn } from "#/lib/utils";
import { ChatInterfaceWrapper } from "./chat-interface-wrapper";
import { ConversationTabContent } from "../conversation-tabs/conversation-tab-content/conversation-tab-content";
import { ResizeHandle } from "../../../ui/resize-handle";
import { useResizablePanels } from "#/hooks/use-resizable-panels";
import { useConversationStore } from "#/stores/conversation-store";
import { useBreakpoint } from "#/hooks/use-breakpoint";

function getMobileChatPanelClass(isRightPanelShown: boolean) {
  return isRightPanelShown ? "h-160" : "flex-1";
}

function getDesktopTabPanelClass(isRightPanelShown: boolean) {
  return isRightPanelShown
    ? "translate-x-0 opacity-100"
    : "w-0 translate-x-full opacity-0";
}

export function ConversationMain() {
  const isMobile = useBreakpoint();
  const { isRightPanelShown } = useConversationStore();

  // Note: Auto-switch to Preview view is now handled in PreviewPanel component
  // It switches from "Code" to "Preview" once workspace files and content are loaded

  // Panel width state is now in Zustand store, synchronized with TopNavbar
  const { leftWidth, rightWidth, isDragging, containerRef, handleMouseDown } =
    useResizablePanels();

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
          // Atoms Plus: Add gap between panels for visual separation
          // Key: min-h-0 + overflow-hidden prevents children from expanding beyond container
          "flex flex-1 min-h-0 overflow-hidden gap-3 p-3",
          isMobile ? "flex-col" : "transition-all duration-300 ease-in-out",
        )}
        style={
          !isMobile
            ? { transitionProperty: isDragging ? "none" : "all" }
            : undefined
        }
      >
        {/* Chat Panel - Left side glass card */}
        {/* CRITICAL: Do NOT use flex-1 class here, as it overrides flexGrow!
            We need dynamic flexGrow values to match TopNavbar's proportional sizing */}
        <div
          className={cn(
            // Atoms Plus: Key fix - min-h-0 for proper height constraint
            // Note: Removed flex-1 to allow dynamic flexGrow from inline style
            "flex flex-col min-h-0 overflow-hidden",
            // Atoms Plus: Glass card effect with rounded corners
            "bg-black/40 backdrop-blur-xl rounded-2xl",
            "border border-white/10",
            "shadow-2xl shadow-black/30",
            isMobile
              ? getMobileChatPanelClass(isRightPanelShown)
              : "transition-all duration-300 ease-in-out",
          )}
          style={
            !isMobile
              ? {
                  // Use flexGrow with flexBasis: 0 to distribute space proportionally
                  // This matches TopNavbar's layout for perfect alignment
                  flexGrow: isRightPanelShown ? leftWidth : 1,
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

        {/* Resize Handle - only shown on desktop when right panel is visible */}
        {!isMobile && isRightPanelShown && (
          <ResizeHandle onMouseDown={handleMouseDown} />
        )}

        {/* Tab Content Panel - Right side glass card */}
        {/* CRITICAL: Do NOT use flex-1 class here, as it overrides flexGrow!
            We need dynamic flexGrow values to match TopNavbar's proportional sizing */}
        <div
          className={cn(
            // Atoms Plus: Key fix - min-h-0 for proper height constraint
            // Note: Removed flex-1 to allow dynamic flexGrow from inline style
            "flex flex-col min-h-0 transition-all duration-300 ease-in-out overflow-hidden",
            // Atoms Plus: Glass card effect with rounded corners
            "bg-black/40 backdrop-blur-xl rounded-2xl",
            "border border-white/10",
            "shadow-2xl shadow-black/30",
            isMobile
              ? cn(
                  "absolute bottom-4 left-3 right-3 top-160",
                  isRightPanelShown
                    ? "h-160 translate-y-0 opacity-100"
                    : "h-0 translate-y-full opacity-0",
                )
              : getDesktopTabPanelClass(isRightPanelShown),
          )}
          style={
            !isMobile
              ? {
                  // Use flexGrow with flexBasis: 0 to distribute space proportionally
                  // This matches TopNavbar's layout for perfect alignment
                  flexGrow: isRightPanelShown ? rightWidth : 0,
                  flexShrink: 1,
                  flexBasis: 0,
                  transitionProperty: isDragging ? "opacity, transform" : "all",
                }
              : undefined
          }
        >
          <div
            className={cn(
              isMobile
                ? "h-full flex flex-col gap-3 pb-2 md:pb-0 pt-2 min-h-0"
                : "flex flex-col flex-1 gap-3 min-w-max h-full min-h-0",
            )}
          >
            <ConversationTabContent />
          </div>
        </div>
      </div>
    </div>
  );
}
