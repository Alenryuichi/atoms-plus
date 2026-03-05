import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AtomsPlusLogoAnimatedProps {
  width?: number;
  height?: number;
  className?: string;
}

export function AtomsPlusLogoAnimated({
  width = 46,
  height = 46,
  className = "",
}: AtomsPlusLogoAnimatedProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!svgRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const svg = svgRef.current;
    const orbits = svg.querySelectorAll(".orbit");
    const electrons = svg.querySelectorAll(".electron");
    const nucleus = svg.querySelector(".nucleus");
    const plusSign = svg.querySelector(".plus-sign");

    // Create timeline for entrance animation
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Initial state - everything invisible
    gsap.set([orbits, electrons, nucleus, plusSign], {
      opacity: 0,
      scale: 0,
      transformOrigin: "center center",
    });

    // Animate nucleus first (scale up with glow)
    tl.to(nucleus, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
    });

    // Plus sign appears
    tl.to(
      plusSign,
      {
        opacity: 1,
        scale: 1,
        duration: 0.3,
      },
      "-=0.2",
    );

    // Orbits draw in (staggered)
    tl.to(
      orbits,
      {
        opacity: 0.7,
        scale: 1,
        duration: 0.6,
        stagger: 0.15,
      },
      "-=0.2",
    );

    // Electrons appear with bounce
    tl.to(
      electrons,
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(1.7)",
      },
      "-=0.3",
    );

    // Continuous orbit rotation animation
    gsap.to(orbits[0], {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: "none",
      transformOrigin: "center center",
    });

    gsap.to(orbits[1], {
      rotation: -360,
      duration: 25,
      repeat: -1,
      ease: "none",
      transformOrigin: "center center",
    });

    gsap.to(orbits[2], {
      rotation: 360,
      duration: 30,
      repeat: -1,
      ease: "none",
      transformOrigin: "center center",
    });

    // Electron pulse animation
    gsap.to(electrons, {
      scale: 1.2,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.3,
    });

    // Nucleus subtle pulse
    gsap.to(nucleus, {
      scale: 1.05,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  // Hover animation
  const handleMouseEnter = () => {
    if (!svgRef.current) return;
    gsap.to(svgRef.current, {
      scale: 1.1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!svgRef.current) return;
    gsap.to(svgRef.current, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      width={width}
      height={height}
      className={className}
      aria-label="Atoms Plus"
      role="img"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: "pointer" }}
    >
      <defs>
        {/* Amber/Gold gradient matching Atoms Plus theme */}
        <linearGradient
          id="atomGradientAnim"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#d4a855" />
          <stop offset="50%" stopColor="#c99a45" />
          <stop offset="100%" stopColor="#b08a3a" />
        </linearGradient>
        <linearGradient
          id="orbitGradientAnim"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#d4a855" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#e4c078" stopOpacity={0.8} />
        </linearGradient>
        <filter id="glowAnim" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Orbit rings */}
      <ellipse
        className="orbit"
        cx="24"
        cy="24"
        rx="18"
        ry="8"
        stroke="url(#orbitGradientAnim)"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(-30 24 24)"
      />
      <ellipse
        className="orbit"
        cx="24"
        cy="24"
        rx="18"
        ry="8"
        stroke="url(#orbitGradientAnim)"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(30 24 24)"
      />
      <ellipse
        className="orbit"
        cx="24"
        cy="24"
        rx="18"
        ry="8"
        stroke="url(#orbitGradientAnim)"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(90 24 24)"
      />

      {/* Central nucleus */}
      <circle
        className="nucleus"
        cx="24"
        cy="24"
        r="7"
        fill="url(#atomGradientAnim)"
        filter="url(#glowAnim)"
      />

      {/* Plus symbol */}
      <g className="plus-sign" fill="white">
        <rect x="22.5" y="20" width="3" height="8" rx="1" />
        <rect x="20" y="22.5" width="8" height="3" rx="1" />
      </g>

      {/* Orbiting electrons */}
      <circle
        className="electron"
        cx="6"
        cy="24"
        r="2.5"
        fill="url(#atomGradientAnim)"
        filter="url(#glowAnim)"
      />
      <circle
        className="electron"
        cx="42"
        cy="24"
        r="2.5"
        fill="url(#atomGradientAnim)"
        filter="url(#glowAnim)"
      />
      <circle
        className="electron"
        cx="24"
        cy="6"
        r="2.5"
        fill="url(#atomGradientAnim)"
        filter="url(#glowAnim)"
      />
    </svg>
  );
}

export default AtomsPlusLogoAnimated;
