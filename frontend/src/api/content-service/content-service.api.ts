/**
 * Content Service API
 *
 * Provides static content for pricing, use cases, videos, and blog.
 * This can be easily swapped out for a real API later.
 */

import { I18nKey } from "#/i18n/declaration";
import type {
  PricingTier,
  UseCase,
  UseCaseCategory,
  Video,
  BlogPost,
} from "./content-service.types";

const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    nameKey: I18nKey.ATOMS$PRICING_FREE_TITLE,
    price: "$0",
    period: "/month",
    features: [
      { key: I18nKey.ATOMS$PRICING_FEATURE_DAILY_5, included: true },
      { key: I18nKey.ATOMS$PRICING_FEATURE_MONTHLY_1M, included: true },
      { key: I18nKey.ATOMS$PRICING_FEATURE_STORAGE_1G, included: true },
      { key: I18nKey.ATOMS$PRICING_FEATURE_RACE_MODE, included: false },
    ],
    ctaKey: I18nKey.ATOMS$PRICING_CTA_FREE,
  },
  {
    id: "pro",
    nameKey: I18nKey.ATOMS$PRICING_PRO_TITLE,
    price: "$20",
    period: "/month",
    highlighted: true,
    badgeKey: I18nKey.ATOMS$PRICING_PRO_BADGE,
    features: [
      { key: I18nKey.ATOMS$PRICING_FEATURE_DAILY_15, included: true },
      { key: I18nKey.ATOMS$PRICING_FEATURE_MONTHLY_10M, included: true },
      { key: I18nKey.ATOMS$PRICING_FEATURE_STORAGE_10G, included: true },
      { key: I18nKey.ATOMS$PRICING_FEATURE_RACE_MODE, included: false },
    ],
    ctaKey: I18nKey.ATOMS$PRICING_CTA_PRO,
  },
  {
    id: "max",
    nameKey: I18nKey.ATOMS$PRICING_MAX_TITLE,
    price: "$100",
    period: "/month",
    features: [
      { key: I18nKey.ATOMS$PRICING_FEATURE_DAILY_15, included: true },
      { key: I18nKey.ATOMS$PRICING_FEATURE_MONTHLY_50M, included: true },
      { key: I18nKey.ATOMS$PRICING_FEATURE_STORAGE_100G, included: true },
      { key: I18nKey.ATOMS$PRICING_FEATURE_RACE_MODE, included: true },
    ],
    ctaKey: I18nKey.ATOMS$PRICING_CTA_MAX,
  },
];

const USE_CASE_CATEGORIES: UseCaseCategory[] = [
  { id: "all", labelKey: I18nKey.ATOMS$RESOURCES_FILTER_ALL },
  { id: "saas", labelKey: I18nKey.ATOMS$CATEGORY_SAAS },
  { id: "ecommerce", labelKey: I18nKey.ATOMS$CATEGORY_ECOMMERCE },
  { id: "internal", labelKey: I18nKey.ATOMS$CATEGORY_INTERNAL },
  { id: "personal", labelKey: I18nKey.ATOMS$CATEGORY_PERSONAL },
];

const USE_CASES: UseCase[] = [
  {
    id: "subscription-saas",
    titleKey: I18nKey.ATOMS$RESOURCES_USECASE_SAAS_TITLE,
    descriptionKey: I18nKey.ATOMS$RESOURCES_USECASE_SAAS_DESC,
    category: "saas",
    gradient: "from-blue-500/20 to-indigo-500/20",
  },
  {
    id: "ecommerce-store",
    titleKey: I18nKey.ATOMS$RESOURCES_USECASE_ECOMMERCE_TITLE,
    descriptionKey: I18nKey.ATOMS$RESOURCES_USECASE_ECOMMERCE_DESC,
    category: "ecommerce",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: "admin-dashboard",
    titleKey: I18nKey.ATOMS$RESOURCES_USECASE_DASHBOARD_TITLE,
    descriptionKey: I18nKey.ATOMS$RESOURCES_USECASE_DASHBOARD_DESC,
    category: "internal",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: "portfolio-site",
    titleKey: I18nKey.ATOMS$RESOURCES_USECASE_PORTFOLIO_TITLE,
    descriptionKey: I18nKey.ATOMS$RESOURCES_USECASE_PORTFOLIO_DESC,
    category: "personal",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  {
    id: "api-backend",
    titleKey: I18nKey.ATOMS$RESOURCES_USECASE_API_TITLE,
    descriptionKey: I18nKey.ATOMS$RESOURCES_USECASE_API_DESC,
    category: "saas",
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  {
    id: "mobile-app",
    titleKey: I18nKey.ATOMS$RESOURCES_USECASE_MOBILE_TITLE,
    descriptionKey: I18nKey.ATOMS$RESOURCES_USECASE_MOBILE_DESC,
    category: "personal",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
];

const VIDEOS: Video[] = [
  {
    id: "getting-started",
    titleKey: I18nKey.ATOMS$RESOURCES_VIDEO_GETTING_STARTED,
    duration: "5:30",
    gradient: "from-indigo-500/30 to-purple-500/30",
    featured: true,
  },
  {
    id: "build-saas",
    titleKey: I18nKey.ATOMS$RESOURCES_VIDEO_BUILD_SAAS,
    duration: "12:45",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "deploy-app",
    titleKey: I18nKey.ATOMS$RESOURCES_VIDEO_DEPLOY,
    duration: "8:20",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: "race-mode",
    titleKey: I18nKey.ATOMS$RESOURCES_VIDEO_RACE_MODE,
    duration: "6:15",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  {
    id: "templates",
    titleKey: I18nKey.ATOMS$RESOURCES_VIDEO_TEMPLATES,
    duration: "4:50",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: "advanced",
    titleKey: I18nKey.ATOMS$RESOURCES_VIDEO_ADVANCED,
    duration: "15:30",
    gradient: "from-purple-500/20 to-indigo-500/20",
  },
];

const BLOG_POSTS: BlogPost[] = [
  {
    id: "introducing-race-mode",
    titleKey: I18nKey.ATOMS$RESOURCES_BLOG_RACE_MODE_TITLE,
    excerptKey: I18nKey.ATOMS$RESOURCES_BLOG_RACE_MODE_EXCERPT,
    date: "2026-03-01",
    author: "Atoms Team",
    gradient: "from-indigo-500/30 to-purple-500/30",
    featured: true,
  },
  {
    id: "metagpt-integration",
    titleKey: I18nKey.ATOMS$RESOURCES_BLOG_METAGPT_TITLE,
    excerptKey: I18nKey.ATOMS$RESOURCES_BLOG_METAGPT_EXCERPT,
    date: "2026-02-25",
    author: "Engineering",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "best-practices",
    titleKey: I18nKey.ATOMS$RESOURCES_BLOG_PRACTICES_TITLE,
    excerptKey: I18nKey.ATOMS$RESOURCES_BLOG_PRACTICES_EXCERPT,
    date: "2026-02-20",
    author: "DevRel",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: "ai-coding-future",
    titleKey: I18nKey.ATOMS$RESOURCES_BLOG_FUTURE_TITLE,
    excerptKey: I18nKey.ATOMS$RESOURCES_BLOG_FUTURE_EXCERPT,
    date: "2026-02-15",
    author: "Atoms Team",
    gradient: "from-orange-500/20 to-red-500/20",
  },
];

// Simulated API delay for realistic loading states
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const ContentService = {
  async getPricingTiers(): Promise<PricingTier[]> {
    await delay(100);
    return PRICING_TIERS;
  },

  async getUseCaseCategories(): Promise<UseCaseCategory[]> {
    await delay(50);
    return USE_CASE_CATEGORIES;
  },

  async getUseCases(): Promise<UseCase[]> {
    await delay(100);
    return USE_CASES;
  },

  async getVideos(): Promise<Video[]> {
    await delay(100);
    return VIDEOS;
  },

  async getBlogPosts(): Promise<BlogPost[]> {
    await delay(100);
    return BLOG_POSTS;
  },
};

export default ContentService;
