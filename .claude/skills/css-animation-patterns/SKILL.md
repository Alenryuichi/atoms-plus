---
name: css-animation-patterns
description: Master CSS animations, Framer Motion, and motion design for React applications. Covers transitions, keyframes, reduced motion accessibility, page transitions, loading states, and microinteractions. Use when implementing animations, creating engaging UI feedback, or ensuring motion accessibility.
---

# CSS Animation Patterns

Create smooth, performant, and accessible animations that enhance user experience without compromising performance or accessibility.

## When to Use This Skill

- Implementing page transitions and route animations
- Creating loading states and skeleton screens
- Building microinteractions for user feedback
- Animating component mount/unmount
- Designing gesture-based interactions
- Ensuring reduced motion accessibility compliance

## Core Concepts

### 1. Animation Categories

| Type | Use Case | Tools |
|------|----------|-------|
| **Micro** | Button hover, focus states | CSS transitions |
| **Feedback** | Success/error indicators | CSS animations |
| **Structural** | Layout changes, modals | Framer Motion |
| **Navigation** | Page transitions | Framer Motion, View Transitions |
| **Loading** | Skeletons, spinners | CSS animations |

### 2. Performance Guidelines

```
✅ Animate: transform, opacity (GPU-accelerated)
⚠️ Careful: filter, clip-path (can be expensive)
❌ Avoid: width, height, top, left, margin (triggers layout)
```

## Framer Motion Patterns

### Pattern 1: Basic Component Animation

```tsx
import { motion } from "framer-motion";

// Fade in on mount
export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Staggered list animation
export function StaggeredList({ items }: { items: string[] }) {
  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {items.map((item) => (
        <motion.li
          key={item}
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0 },
          }}
        >
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### Pattern 2: Page Transitions (App Router)

```tsx
// app/template.tsx - Wraps page content for transitions
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Pattern 3: Reduced Motion Support

```tsx
import { motion, useReducedMotion } from "framer-motion";

export function AccessibleAnimation({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
      }}
    >
      {children}
    </motion.div>
  );
}

// CSS approach for reduced motion
const styles = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
```

## CSS Transition Patterns

### Pattern 4: Interactive States

```css
/* Button with smooth hover/active states */
.button {
  transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

### Pattern 5: Loading Skeleton

```tsx
// Skeleton component with shimmer effect
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

// In your global CSS
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
```

## Best Practices

### Do's
- Use `transform` and `opacity` for 60fps animations
- Respect `prefers-reduced-motion` preference
- Keep durations under 400ms for UI feedback
- Use `will-change` sparingly and remove after animation

### Don'ts
- Don't animate layout properties (width, height, margin)
- Don't use animations that flash or flicker rapidly
- Don't block user interaction during animations
- Don't auto-play infinite animations without user control

## Animation Timing Reference

| Interaction | Duration | Easing |
|------------|----------|--------|
| Hover states | 100-150ms | ease-out |
| Button press | 100ms | ease |
| Modal open | 200-300ms | ease-out |
| Modal close | 150-200ms | ease-in |
| Page transition | 300-400ms | ease-in-out |
| Loading spinner | 1000-1500ms | linear |

