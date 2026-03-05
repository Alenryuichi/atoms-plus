import { ReactNode } from "react";

interface TabContainerProps {
  children: ReactNode;
}

export function TabContainer({ children }: TabContainerProps) {
  return (
    // Atoms Plus: Transparent container - parent glass card handles background
    <div className="bg-transparent flex flex-col h-full w-full overflow-hidden">
      {children}
    </div>
  );
}
