---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - docs/METAGPT_INTEGRATION.md
  - frontend/src/components/features/top-navbar/top-navbar.tsx
  - frontend/src/routes/atoms-home.tsx
  - frontend/src/routes.ts
  - frontend/src/i18n/declaration.ts
---

# UX Design Specification: Atoms Plus Pricing & Resources Pages

**Author:** Ryuichi
**Date:** 2026-03-04
**Project:** atoms-plus

---

## Executive Summary

### Project Vision

Atoms Plus is a clone/extension of atoms.dev, providing AI-powered software development capabilities. This UX specification covers the design of public-facing pages: **Pricing** and **Resources** (Blog, Use Cases, Videos) that are linked from the top navigation bar.

The goal is to create a cohesive, modern design that matches the existing atoms.dev aesthetic - dark theme with gradient accents, smooth animations, and clear information hierarchy.

### Target Users

1. **Prospective Customers** - Developers, entrepreneurs, and teams evaluating AI-powered development tools
2. **Existing Free Users** - Looking to upgrade their plan for more features
3. **Content Consumers** - Seeking tutorials, use cases, and educational videos

### Key Design Challenges

1. **Pricing Clarity** - Communicate value propositions clearly across 3 tiers (Free, Pro 20, Max 100)
2. **Content Discovery** - Make resources (blog, videos, use cases) easily browsable and searchable
3. **Consistency** - Maintain visual harmony with existing atoms-home.tsx landing page

### Design Opportunities

1. **Social Proof Integration** - Leverage use cases to build trust
2. **Conversion Optimization** - Strategic CTAs on pricing page
3. **Video Engagement** - Rich media experiences for tutorials

---

## Core Experience Definition

### Page Architecture

```
/pricing          → PricingPage (New)
/blog             → BlogPage (New - placeholder for future content)
/usecases         → UseCasesPage (New)
/videos           → VideosPage (New)
```

### Design System Alignment

The pages will use the existing design patterns from `atoms-home.tsx`:

- **Background**: Dark theme (`bg-base`, `bg-neutral-900`)
- **Typography**: White/neutral-300 text with gradient highlights
- **Cards**: `bg-neutral-900/50` with `border-neutral-700/30`
- **CTAs**: Gradient buttons (`from-indigo-600 to-purple-600`)
- **Animations**: Framer Motion with spring transitions

---

## Page Specifications

### 1. Pricing Page (`/pricing`)

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [TopNavbar - Already exists]                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Hero Section                             │
│         "Choose your plan" + Subtitle                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │   FREE   │    │  PRO 20  │    │  MAX 100 │              │
│  │          │    │ POPULAR  │    │          │              │
│  │  $0/mo   │    │  $20/mo  │    │ $100/mo  │              │
│  │          │    │          │    │          │              │
│  │ • 5 daily│    │ • 15     │    │ • 15     │              │
│  │ • 1M     │    │ • 10M    │    │ • 50M    │              │
│  │ • 1G     │    │ • 10G    │    │ • 100G   │              │
│  │          │    │          │    │ • Race   │              │
│  │ [Start]  │    │ [Get Pro]│    │ [Get Max]│              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    FAQ Section                              │
│         Accordion-style common questions                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Footer CTA                               │
│         "Ready to start building?"                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Pricing Tiers Data

| Feature | Free | Pro 20 | Max 100 |
|---------|------|--------|---------|
| Price | $0/month | $20/month | $100/month |
| Daily Credits | 5 | 15 | 15 |
| Monthly Credits | 1M | 10M | 50M |
| Storage | 1G | 10G | 100G |
| Race Mode | ❌ | ❌ | ✅ |

#### Component Hierarchy

```tsx
PricingPage
├── HeroSection
│   ├── Title (gradient)
│   └── Subtitle
├── PricingGrid
│   ├── PricingCard (Free)
│   ├── PricingCard (Pro 20) [highlighted]
│   └── PricingCard (Max 100)
├── FAQSection
│   └── FAQItem[] (Accordion)
└── CTASection
    └── GradientButton
```

#### i18n Keys (Prefix: `ATOMS$PRICING_`)

```
ATOMS$PRICING_HERO_TITLE = "Simple, transparent pricing"
ATOMS$PRICING_HERO_SUBTITLE = "Start free, upgrade when you need more power"
ATOMS$PRICING_FREE_TITLE = "Free"
ATOMS$PRICING_FREE_PRICE = "$0"
ATOMS$PRICING_FREE_PERIOD = "/month"
ATOMS$PRICING_PRO_TITLE = "Pro 20"
ATOMS$PRICING_PRO_PRICE = "$20"
ATOMS$PRICING_PRO_BADGE = "Popular"
ATOMS$PRICING_MAX_TITLE = "Max 100"
ATOMS$PRICING_MAX_PRICE = "$100"
ATOMS$PRICING_FEATURE_DAILY_CREDITS = "{count} daily credits"
ATOMS$PRICING_FEATURE_MONTHLY_CREDITS = "{count} monthly credits"
ATOMS$PRICING_FEATURE_STORAGE = "{size} storage"
ATOMS$PRICING_FEATURE_RACE_MODE = "Race Mode"
ATOMS$PRICING_CTA_FREE = "Start Free"
ATOMS$PRICING_CTA_PRO = "Get Pro"
ATOMS$PRICING_CTA_MAX = "Get Max"
ATOMS$PRICING_FAQ_TITLE = "Frequently Asked Questions"
ATOMS$PRICING_FOOTER_TITLE = "Ready to start building?"
ATOMS$PRICING_FOOTER_CTA = "Get Started"
```

---

### 2. Use Cases Page (`/usecases`)

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [TopNavbar]                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Hero Section                             │
│         "What developers are building"                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filter Tags: [All] [SaaS] [E-commerce] [Internal] [...]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   [Image]       │  │   [Image]       │                  │
│  │                 │  │                 │                  │
│  │   Title         │  │   Title         │                  │
│  │   Description   │  │   Description   │                  │
│  │   [Read More]   │  │   [Read More]   │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   [Image]       │  │   [Image]       │                  │
│  │   ...           │  │   ...           │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Component Hierarchy

```tsx
UseCasesPage
├── HeroSection
│   ├── Title
│   └── Subtitle
├── FilterTabs
│   └── Tab[] (All, SaaS, E-commerce, etc.)
├── UseCaseGrid
│   └── UseCaseCard[]
│       ├── Image/Gradient
│       ├── Title
│       ├── Description
│       ├── Tags
│       └── ReadMoreLink
└── CTASection
```

#### i18n Keys (Prefix: `ATOMS$RESOURCES_`)

```
ATOMS$RESOURCES_USECASES_TITLE = "What developers are building"
ATOMS$RESOURCES_USECASES_SUBTITLE = "See how teams are using Atoms Plus"
ATOMS$RESOURCES_FILTER_ALL = "All"
ATOMS$RESOURCES_USECASE_READ_MORE = "Read more"
```

---

### 3. Videos Page (`/videos`)

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [TopNavbar]                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Hero Section                             │
│         "Learn with video tutorials"                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Featured Video (Large)                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              [Video Thumbnail]                      │   │
│  │                   ▶ Play                            │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Recent Videos Grid (3 columns)                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ [Thumb]  │  │ [Thumb]  │  │ [Thumb]  │                  │
│  │ Title    │  │ Title    │  │ Title    │                  │
│  │ Duration │  │ Duration │  │ Duration │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Component Hierarchy

```tsx
VideosPage
├── HeroSection
│   ├── Title
│   └── Subtitle
├── FeaturedVideo
│   ├── VideoThumbnail
│   ├── PlayButton
│   ├── Title
│   └── Description
├── VideoGrid
│   └── VideoCard[]
│       ├── Thumbnail
│       ├── Title
│       ├── Duration
│       └── Category
└── CTASection
```

#### i18n Keys

```
ATOMS$RESOURCES_VIDEOS_TITLE = "Learn with video tutorials"
ATOMS$RESOURCES_VIDEOS_SUBTITLE = "Watch step-by-step guides and tutorials"
ATOMS$RESOURCES_VIDEOS_FEATURED = "Featured"
ATOMS$RESOURCES_VIDEOS_RECENT = "Recent Videos"
ATOMS$RESOURCES_VIDEOS_WATCH = "Watch"
```

---

### 4. Blog Page (`/blog`)

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [TopNavbar]                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Hero Section                             │
│         "Blog" + "Stories, updates, and insights"          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Featured Post (Full Width)                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Image]                           │ Title            │   │
│  │                                   │ Excerpt          │   │
│  │                                   │ [Read]           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Category Tabs: [All] [Product] [Engineering] [...]        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Blog Posts Grid (3 columns)                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ [Image]  │  │ [Image]  │  │ [Image]  │                  │
│  │ Category │  │ Category │  │ Category │                  │
│  │ Title    │  │ Title    │  │ Title    │                  │
│  │ Date     │  │ Date     │  │ Date     │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Component Hierarchy

```tsx
BlogPage
├── HeroSection
│   ├── Title
│   └── Subtitle
├── FeaturedPost
│   ├── Image
│   ├── Title
│   ├── Excerpt
│   └── ReadLink
├── CategoryTabs
│   └── Tab[]
├── BlogPostGrid
│   └── BlogPostCard[]
│       ├── Image
│       ├── Category
│       ├── Title
│       ├── Excerpt
│       └── Date
└── Pagination
```

#### i18n Keys

```
ATOMS$RESOURCES_BLOG_TITLE = "Blog"
ATOMS$RESOURCES_BLOG_SUBTITLE = "Stories, updates, and insights"
ATOMS$RESOURCES_BLOG_FEATURED = "Featured Post"
ATOMS$RESOURCES_BLOG_CATEGORY_ALL = "All"
ATOMS$RESOURCES_BLOG_CATEGORY_PRODUCT = "Product"
ATOMS$RESOURCES_BLOG_CATEGORY_ENGINEERING = "Engineering"
ATOMS$RESOURCES_BLOG_CATEGORY_TUTORIALS = "Tutorials"
ATOMS$RESOURCES_BLOG_READ_MORE = "Read more"
ATOMS$RESOURCES_BLOG_COMING_SOON = "Coming soon"
```

---

## Visual Design Specifications

### Color Palette (From Existing System)

```css
--bg-base: #0a0a0a
--bg-card: rgba(23, 23, 23, 0.5)
--border: rgba(64, 64, 64, 0.3)
--text-primary: #ffffff
--text-secondary: #a3a3a3
--accent-gradient: linear-gradient(to right, #6366f1, #a855f7, #ec4899)
--cta-gradient: linear-gradient(to right, #4f46e5, #9333ea)
```

### Typography

```css
/* Hero Title */
font-size: clamp(2.25rem, 5vw, 4.5rem);
font-weight: 700;
line-height: 1.1;

/* Section Title */
font-size: clamp(1.5rem, 3vw, 2.25rem);
font-weight: 600;

/* Body Text */
font-size: 1rem;
line-height: 1.6;
color: #a3a3a3;

/* Card Title */
font-size: 1.125rem;
font-weight: 600;
```

### Spacing

```css
/* Section Padding */
padding: 4rem 1rem; /* Mobile */
padding: 5rem 2rem; /* Tablet */
padding: 6rem 3rem; /* Desktop */

/* Card Gap */
gap: 1rem; /* Mobile */
gap: 1.5rem; /* Desktop */
```

### Animation Patterns (Framer Motion)

```typescript
// Container stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

// Item fade up
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  }
};

// Card hover
const cardVariants = {
  hover: {
    scale: 1.03,
    y: -6,
    transition: { type: "spring", stiffness: 400, damping: 20 }
  }
};
```

---

## Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Tablet portrait */
md: 768px   /* Tablet landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Grid Layouts

```css
/* Pricing Cards */
grid-cols-1 md:grid-cols-3

/* Use Cases / Videos / Blog */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

---

## Implementation Notes

### Route Configuration

Add to `frontend/src/routes.ts`:

```typescript
route("pricing", "routes/pricing.tsx"),
route("usecases", "routes/usecases.tsx"),
route("videos", "routes/videos.tsx"),
route("blog", "routes/blog.tsx"),
```

### Data Fetching Strategy

For MVP, pages will use static data. Future iterations can integrate TanStack Query for dynamic content:

- **Blog**: `/api/blog/posts`
- **Videos**: YouTube API or internal video API
- **Use Cases**: `/api/usecases`

### Accessibility Requirements

- All images must have `alt` text
- Keyboard navigation support
- ARIA labels for interactive elements
- Color contrast ratio ≥ 4.5:1
- Focus visible indicators

---

## Success Metrics

- [ ] All 4 pages render without errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] i18n keys properly defined
- [ ] No linting errors
- [ ] Build succeeds
- [ ] Visual consistency with atoms-home.tsx

---

## File Deliverables

1. `frontend/src/routes/pricing.tsx`
2. `frontend/src/routes/usecases.tsx`
3. `frontend/src/routes/videos.tsx`
4. `frontend/src/routes/blog.tsx`
5. Updated `frontend/src/routes.ts`
6. Updated `frontend/src/i18n/declaration.ts`
7. Updated `frontend/src/i18n/translation.json`
