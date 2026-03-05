import { cn } from "#/utils/utils";

interface BrandButtonProps {
  testId?: string;
  name?: string;
  variant: "primary" | "secondary" | "danger" | "ghost-danger";
  type: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  isDisabled?: boolean;
  className?: string;
  onClick?: () => void;
  startContent?: React.ReactNode;
}

export function BrandButton({
  testId,
  name,
  children,
  variant,
  type,
  isDisabled,
  className,
  onClick,
  startContent,
}: React.PropsWithChildren<BrandButtonProps>) {
  return (
    <button
      name={name}
      data-testid={testId}
      disabled={isDisabled}
      // The type is alreadt passed as a prop to the button component
      // eslint-disable-next-line react/button-has-type
      type={type}
      onClick={onClick}
      className={cn(
        "relative w-fit px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
        // Primary: Amber gradient with glow
        variant === "primary" && [
          "bg-gradient-to-r from-amber-600 to-amber-500 text-white",
          "hover:from-amber-500 hover:to-amber-400 hover:shadow-lg hover:shadow-amber-500/25",
          "active:scale-[0.98]",
        ],
        // Secondary: Transparent with amber border
        variant === "secondary" && [
          "bg-transparent border border-amber-500/50 text-amber-500",
          "hover:bg-amber-500/10 hover:border-amber-500",
        ],
        // Danger: Red gradient
        variant === "danger" && [
          "bg-gradient-to-r from-red-600 to-red-500 text-white",
          "hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/25",
        ],
        // Ghost Danger: Transparent red text
        variant === "ghost-danger" && [
          "bg-transparent text-red-500 underline underline-offset-2",
          "hover:text-red-400 hover:no-underline",
        ],
        startContent && "flex items-center justify-center gap-2",
        className,
      )}
    >
      {startContent}
      {children}
    </button>
  );
}
