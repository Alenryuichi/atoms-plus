import atomsPlusLogo from "./atoms-plus-logo.png";

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
    <img
      src={atomsPlusLogo}
      alt="Atoms Plus"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

export default AtomsPlusLogo;
