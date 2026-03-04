---
name: frontend-performance-optimization
description: Optimize frontend performance with Core Web Vitals, image optimization, code splitting, and bundle size reduction. Use when improving page load times, optimizing LCP/CLS/FID, or reducing bundle sizes.
---

# Frontend Performance Optimization

Achieve excellent Core Web Vitals scores and fast user experiences through systematic performance optimization.

## When to Use This Skill

- Improving Lighthouse performance scores
- Optimizing Core Web Vitals (LCP, CLS, FID/INP)
- Reducing JavaScript bundle sizes
- Implementing image optimization
- Setting up code splitting strategies
- Debugging performance bottlenecks

## Core Web Vitals

### 1. Metrics Overview

| Metric | Good | Needs Improvement | Poor | Measures |
|--------|------|------------------|------|----------|
| **LCP** (Largest Contentful Paint) | ≤2.5s | ≤4.0s | >4.0s | Loading |
| **FID** (First Input Delay) | ≤100ms | ≤300ms | >300ms | Interactivity |
| **INP** (Interaction to Next Paint) | ≤200ms | ≤500ms | >500ms | Responsiveness |
| **CLS** (Cumulative Layout Shift) | ≤0.1 | ≤0.25 | >0.25 | Visual stability |

### 2. Quick Wins Checklist

```
□ Images: Use next/image or <img loading="lazy">
□ Fonts: Use font-display: swap
□ LCP: Preload hero image/above-fold content
□ CLS: Set explicit width/height on images
□ JS: Code-split routes with dynamic imports
□ CSS: Extract critical CSS inline
```

## Image Optimization

### Pattern 1: Next.js Image Component

```tsx
import Image from "next/image";

export function OptimizedHero() {
  return (
    <div className="relative h-[600px]">
      <Image
        src="/hero.jpg"
        alt="Hero description"
        fill
        priority // Preload above-fold images
        sizes="100vw"
        className="object-cover"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j..." // Low-quality placeholder
      />
    </div>
  );
}

// Responsive image with art direction
export function ResponsiveImage() {
  return (
    <Image
      src="/product.jpg"
      alt="Product"
      width={800}
      height={600}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
      quality={85}
    />
  );
}
```

### Pattern 2: Native Lazy Loading

```html
<!-- Lazy load below-fold images -->
<img src="image.jpg" alt="Description" loading="lazy" decoding="async" width="800" height="600" />

<!-- Eager load above-fold (LCP candidates) -->
<img src="hero.jpg" alt="Hero" loading="eager" fetchpriority="high" width="1200" height="600" />
```

## Code Splitting

### Pattern 3: Route-Based Splitting (Next.js)

```tsx
// Automatic with App Router - each page is code-split
// app/dashboard/page.tsx - Only loads when visiting /dashboard
export default function DashboardPage() {
  return <Dashboard />;
}
```

### Pattern 4: Component-Level Splitting

```tsx
import dynamic from "next/dynamic";

// Heavy component loaded only when needed
const HeavyChart = dynamic(() => import("@/components/HeavyChart"), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Disable SSR for client-only components
});

// Modal loaded on demand
const SettingsModal = dynamic(() => import("@/components/SettingsModal"));

export function Dashboard() {
  const [showSettings, setShowSettings] = useState(false);
  return (
    <>
      <HeavyChart data={data} />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
```

## Bundle Size Optimization

### Pattern 5: Import Optimization

```tsx
// ❌ Bad: Imports entire library
import _ from "lodash";
_.debounce(fn, 300);

// ✅ Good: Tree-shakeable import
import debounce from "lodash/debounce";
debounce(fn, 300);

// ❌ Bad: Imports all icons
import * as Icons from "lucide-react";

// ✅ Good: Named imports only
import { Search, Menu, X } from "lucide-react";
```

### Pattern 6: Analyzing Bundle Size

```bash
# Next.js bundle analyzer
npm install @next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
module.exports = withBundleAnalyzer({ /* config */ });
```

```bash
# Run analysis
ANALYZE=true npm run build
```

## Font Optimization

### Pattern 7: Next.js Font Loading

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

## Preventing Layout Shift (CLS)

### Pattern 8: Aspect Ratio Containers

```tsx
// Reserve space for dynamic content
export function VideoEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="relative aspect-video bg-gray-100">
      <iframe
        src={`https://youtube.com/embed/${videoId}`}
        className="absolute inset-0 w-full h-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write"
      />
    </div>
  );
}

// Skeleton with fixed dimensions
export function CardSkeleton() {
  return (
    <div className="w-full h-[200px] bg-gray-200 animate-pulse rounded-lg" />
  );
}
```

## Performance Monitoring

```tsx
// Report Core Web Vitals
export function reportWebVitals(metric) {
  console.log(metric); // Or send to analytics
  // { name: 'LCP', value: 2500, rating: 'good' }
}
```

## Best Practices

### Do's
- Preload critical resources (`<link rel="preload">`)
- Use `loading="lazy"` for below-fold images
- Set explicit dimensions on images/videos
- Code-split routes and heavy components
- Inline critical CSS for above-fold content

### Don'ts
- Don't load unnecessary JavaScript upfront
- Don't use large unoptimized images
- Don't block rendering with sync scripts
- Don't cause layout shifts with dynamic content
- Don't over-optimize (measure first!)

