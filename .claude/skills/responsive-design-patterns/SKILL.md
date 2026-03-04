---
name: responsive-design-patterns
description: Master responsive design with mobile-first strategies, container queries, fluid typography, and modern CSS layout techniques. Use when building adaptive layouts, implementing breakpoint strategies, or creating fluid responsive interfaces.
---

# Responsive Design Patterns

Build adaptive interfaces that work seamlessly across all device sizes using modern CSS techniques and mobile-first methodology.

## When to Use This Skill

- Designing mobile-first layouts
- Implementing breakpoint strategies
- Creating fluid typography and spacing
- Using container queries for component-level responsiveness
- Building responsive navigation patterns
- Optimizing images for different screen sizes

## Core Concepts

### 1. Mobile-First Breakpoints

```css
/* Mobile-first breakpoint system */
:root {
  /* Breakpoint values */
  --bp-sm: 640px;   /* Small tablets */
  --bp-md: 768px;   /* Tablets */
  --bp-lg: 1024px;  /* Laptops */
  --bp-xl: 1280px;  /* Desktops */
  --bp-2xl: 1536px; /* Large screens */
}

/* Usage: Start mobile, enhance upward */
.container {
  padding: 1rem;           /* Mobile default */
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;         /* Tablet and up */
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 4rem;         /* Desktop and up */
    max-width: 1200px;
  }
}
```

### 2. Tailwind Breakpoint Reference

| Prefix | Min-width | Target Devices |
|--------|-----------|----------------|
| (none) | 0px | Mobile phones |
| `sm:` | 640px | Large phones, small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops, small desktops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large monitors |

## Fluid Typography

### Pattern 1: Clamp-Based Fluid Type

```css
/* Fluid typography that scales smoothly */
:root {
  /* clamp(min, preferred, max) */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1rem + 1.25vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1rem + 2.5vw, 2rem);
  --text-3xl: clamp(1.875rem, 1rem + 4.375vw, 3rem);
  --text-4xl: clamp(2.25rem, 1rem + 6.25vw, 4rem);
}

h1 { font-size: var(--text-4xl); }
h2 { font-size: var(--text-3xl); }
h3 { font-size: var(--text-2xl); }
p  { font-size: var(--text-base); }
```

### Pattern 2: Fluid Spacing Scale

```css
:root {
  --space-xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);
  --space-sm: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);
  --space-md: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --space-lg: clamp(1.5rem, 1rem + 2.5vw, 2.5rem);
  --space-xl: clamp(2rem, 1rem + 5vw, 4rem);
  --space-2xl: clamp(3rem, 1.5rem + 7.5vw, 6rem);
}
```

## Container Queries

### Pattern 3: Component-Level Responsiveness

```css
/* Define container context */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Style based on container width, not viewport */
.card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

@container card (min-width: 400px) {
  .card {
    grid-template-columns: 200px 1fr;
    padding: 1.5rem;
  }
}

@container card (min-width: 600px) {
  .card {
    grid-template-columns: 250px 1fr auto;
    padding: 2rem;
  }
}
```

### Pattern 4: Tailwind Container Queries

```tsx
// Tailwind v4 container query syntax
export function ResponsiveCard() {
  return (
    <div className="@container">
      <div className="flex flex-col @md:flex-row @lg:gap-6 gap-4 p-4 @md:p-6">
        <img className="w-full @md:w-48 @lg:w-64 rounded-lg" src="..." alt="..." />
        <div className="flex-1">
          <h3 className="text-lg @lg:text-xl font-semibold">Title</h3>
          <p className="text-sm @md:text-base text-gray-600">Description...</p>
        </div>
      </div>
    </div>
  );
}
```

## Responsive Layouts

### Pattern 5: Auto-Fit Grid

```css
/* Responsive grid without media queries */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 1.5rem;
}

/* With Tailwind */
.auto-grid-tw {
  @apply grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6;
}
```

### Pattern 6: Responsive Navigation

```tsx
export function ResponsiveNav() {
  return (
    <nav className="flex items-center justify-between p-4">
      <Logo />
      {/* Desktop menu */}
      <ul className="hidden md:flex gap-6">
        <NavLinks />
      </ul>
      {/* Mobile hamburger */}
      <MobileMenuButton className="md:hidden" />
    </nav>
  );
}
```

## Responsive Images

### Pattern 7: Optimized Image Loading

```tsx
import Image from "next/image";

export function ResponsiveImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover"
      priority // For above-the-fold images
    />
  );
}
```

## Best Practices

### Do's
- Start with mobile styles, enhance upward
- Use `min-width` queries for mobile-first
- Prefer container queries for reusable components
- Use fluid values (`clamp()`) over fixed breakpoints
- Test on real devices, not just resized browsers

### Don'ts
- Don't use `max-width` queries (desktop-first anti-pattern)
- Don't create too many breakpoints (3-5 is usually enough)
- Don't hide essential content on mobile
- Don't rely solely on viewport width for component layout

