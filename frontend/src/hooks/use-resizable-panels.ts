import { useRef, useCallback, useEffect } from "react";
import { useConversationStore } from "#/stores/conversation-store";

/**
 * Hook for managing resizable panels with synchronized state.
 * Uses Zustand store for state management, allowing TopNavbar and ConversationMain
 * to share the same panel width state.
 */
export function useResizablePanels() {
  const {
    panelLeftWidth: leftWidth,
    panelIsDragging: isDragging,
    setPanelLeftWidth: setLeftWidth,
    setPanelIsDragging: setIsDragging,
    persistPanelWidth,
  } = useConversationStore();

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [setIsDragging],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const containerWidth = containerRect.width;
      const newLeftWidth = (mouseX / containerWidth) * 100;

      // Store handles clamping internally
      setLeftWidth(newLeftWidth);
    },
    [isDragging, setLeftWidth],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      persistPanelWidth();
    }
  }, [isDragging, setIsDragging, persistPanelWidth]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      if (isDragging) {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const rightWidth = 100 - leftWidth;

  return {
    leftWidth,
    rightWidth,
    isDragging,
    containerRef,
    handleMouseDown,
  };
}
