---
name: design-tokens-implementation
description: Implement design token systems using CSS custom properties, Style Dictionary, and modern theming patterns. Covers token naming conventions, dark mode, and multi-brand theming. Use when building design systems, implementing themes, or creating consistent styling infrastructure.
---

# Design Tokens Implementation

Build scalable, maintainable design token systems that bridge design and development with consistent naming, theming, and tooling.

## When to Use This Skill

- Setting up design token infrastructure
- Implementing dark mode with CSS custom properties
- Creating multi-brand theming systems
- Configuring Style Dictionary for token transformation
- Establishing token naming conventions
- Building theme switching functionality

## Core Concepts

### 1. Token Hierarchy

```
Primitive Tokens → Semantic Tokens → Component Tokens
     ↓                   ↓                  ↓
  blue-500         color-primary      button-bg-primary
  gray-100         color-surface      card-background
```

### 2. Token Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| **Color** | `--color-primary`, `--color-error` | Brand and semantic colors |
| **Typography** | `--font-size-lg`, `--font-weight-bold` | Text styling |
| **Spacing** | `--space-4`, `--space-8` | Layout and gaps |
| **Radius** | `--radius-sm`, `--radius-full` | Border radius |
| **Shadow** | `--shadow-sm`, `--shadow-lg` | Elevation |
| **Animation** | `--duration-fast`, `--ease-out` | Motion timing |

## CSS Custom Properties

### Pattern 1: Complete Token System

```css
:root {
  /* Primitive Color Tokens */
  --blue-50: oklch(97% 0.02 240);
  --blue-500: oklch(55% 0.25 240);
  --blue-600: oklch(48% 0.25 240);
  --gray-50: oklch(98% 0.005 240);
  --gray-900: oklch(20% 0.01 240);

  /* Semantic Color Tokens */
  --color-primary: var(--blue-500);
  --color-primary-hover: var(--blue-600);
  --color-background: var(--gray-50);
  --color-foreground: var(--gray-900);
  --color-surface: white;
  --color-border: oklch(90% 0.01 240);

  /* Typography Tokens */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;

  /* Spacing Tokens (4px base) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* Radius Tokens */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Shadow Tokens */
  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
  --shadow-md: 0 4px 6px oklch(0% 0 0 / 0.1);
  --shadow-lg: 0 10px 15px oklch(0% 0 0 / 0.1);

  /* Animation Tokens */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Pattern 2: Dark Mode Implementation

```css
/* Light mode (default) */
:root {
  --color-background: var(--gray-50);
  --color-foreground: var(--gray-900);
  --color-surface: white;
  --color-border: var(--gray-200);
  --color-muted: var(--gray-500);
}

/* Dark mode - system preference */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: var(--gray-950);
    --color-foreground: var(--gray-50);
    --color-surface: var(--gray-900);
    --color-border: var(--gray-800);
    --color-muted: var(--gray-400);
  }
}

/* Dark mode - class-based toggle */
:root.dark {
  --color-background: var(--gray-950);
  --color-foreground: var(--gray-50);
  --color-surface: var(--gray-900);
  --color-border: var(--gray-800);
}
```

### Pattern 3: Theme Switching in React

```tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: "system", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    root.classList.remove("light", "dark");
    if (theme === "system") {
      root.classList.add(systemDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

## Token Naming Conventions

### Recommended Format

```
--{category}-{property}-{variant}-{state}

Examples:
--color-bg-primary
--color-text-muted
--button-bg-primary-hover
--input-border-error
```

### Category Prefixes

| Prefix | Usage |
|--------|-------|
| `color-` | All color tokens |
| `font-` | Typography tokens |
| `space-` | Spacing/sizing |
| `radius-` | Border radius |
| `shadow-` | Box shadows |
| `z-` | Z-index layers |

## Best Practices

### Do's
- Use semantic tokens in components (not primitives)
- Define tokens at `:root` level for global scope
- Use OKLCH for perceptually uniform colors
- Keep token names technology-agnostic
- Document token usage with comments

### Don'ts
- Don't hardcode values in components
- Don't create too many one-off tokens
- Don't mix naming conventions
- Don't skip the semantic layer

