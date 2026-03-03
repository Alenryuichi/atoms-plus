import { ReactNode } from "react";

interface TabContainerProps {
  children: ReactNode;
}

export function TabContainer({ children }: TabContainerProps) {
  return (
    <div className="bg-card border border-border/50 rounded-xl flex flex-col h-full w-full shadow-sm">
      {children}
    </div>
  );
}
