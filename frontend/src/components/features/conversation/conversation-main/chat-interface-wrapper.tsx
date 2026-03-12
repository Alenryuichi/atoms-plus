import { cn } from "#/utils/utils";
import { ChatInterface } from "../../chat/chat-interface";

interface ChatInterfaceWrapperProps {
  isRightPanelShown: boolean;
}

export function ChatInterfaceWrapper({
  isRightPanelShown,
}: ChatInterfaceWrapperProps) {
  return (
    // Atoms Plus: Ensure proper height inheritance with min-h-0
    <div className="flex justify-center w-full h-full min-h-0 flex-1">
      <div
        className={cn(
          "w-full h-full min-h-0 flex flex-col transition-all duration-300 ease-in-out",
          isRightPanelShown ? "max-w-[960px]" : "max-w-[1180px]",
        )}
      >
        <ChatInterface />
      </div>
    </div>
  );
}
