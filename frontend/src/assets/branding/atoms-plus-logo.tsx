import AtomsPlusIconDark from "./atoms-plus/atoms-plus-icon-dark.png";
import AtomsPlusIconLight from "./atoms-plus/atoms-plus-icon-light.png";

interface AtomsPlusLogoProps {
  width?: number;
  height?: number;
  className?: string;
  variant?: "dark" | "light";
}

export function AtomsPlusLogo({
  width = 46,
  height = 46,
  className = "",
  variant = "dark",
}: AtomsPlusLogoProps) {
  const src = variant === "light" ? AtomsPlusIconLight : AtomsPlusIconDark;

  return (
    <img
      src={src}
      width={width}
      height={height}
      className={className}
      alt="Atoms Plus"
      style={{ objectFit: "contain" }}
    />
  );
}

export default AtomsPlusLogo;
