import AtomsPlusLogoSvg from "./atoms-plus-logo.svg?react";

interface AtomsPlusLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function AtomsPlusLogo({
  width = 46,
  height = 46,
  className = "",
}: AtomsPlusLogoProps) {
  return (
    <AtomsPlusLogoSvg
      width={width}
      height={height}
      className={className}
      aria-label="Atoms Plus"
      role="img"
    />
  );
}

export default AtomsPlusLogo;
