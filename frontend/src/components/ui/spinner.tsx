/* eslint-disable react/jsx-props-no-spreading */
import * as React from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#/lib/utils";

const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface SpinnerProps
  extends
    React.HTMLAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, label = "Loading...", ...props }, ref) => (
    <IconLoader2
      ref={ref}
      className={cn(spinnerVariants({ size, className }))}
      aria-label={label}
      role="status"
      stroke={1.5}
      {...props}
    />
  ),
);
Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };
