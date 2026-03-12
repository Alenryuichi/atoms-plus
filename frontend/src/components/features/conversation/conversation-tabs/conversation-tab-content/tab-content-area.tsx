import { ReactNode } from "react";

interface TabContentAreaProps {
  children: ReactNode;
  ariaLabelledBy?: string;
}

export function TabContentArea({
  children,
  ariaLabelledBy,
}: TabContentAreaProps) {
  return (
    <div
      id="conversation-tab-panel"
      role="tabpanel"
      aria-labelledby={ariaLabelledBy}
      tabIndex={0}
      className="relative h-full w-full flex-grow overflow-hidden"
    >
      {children}
    </div>
  );
}
