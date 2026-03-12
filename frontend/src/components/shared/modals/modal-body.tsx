/* eslint-disable react/jsx-props-no-spreading */

import React from "react";
import { cn } from "#/utils/utils";

type ModalWidth = "small" | "medium";

interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  testID?: string;
  children: React.ReactNode;
  width?: ModalWidth;
}

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ testID, children, className, width = "small", ...props }, ref) => (
    <div
      ref={ref}
      data-testid={testID}
      className={cn(
        "bg-base-secondary flex flex-col gap-6 items-center p-6 rounded-xl",
        width === "small" && "w-[384px]",
        width === "medium" && "w-[700px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

ModalBody.displayName = "ModalBody";
