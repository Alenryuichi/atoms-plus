/**
 * Content Service Types
 *
 * Types for static content (pricing, use cases, videos, blog)
 * that can be easily swapped out for a real API later.
 */

import { I18nKey } from "#/i18n/declaration";

export interface PricingTier {
  id: string;
  nameKey: I18nKey;
  price: string;
  period: string;
  features: { key: I18nKey; included: boolean }[];
  ctaKey: I18nKey;
  highlighted?: boolean;
  badgeKey?: I18nKey;
}

export interface UseCase {
  id: string;
  titleKey: I18nKey;
  descriptionKey: I18nKey;
  category: string;
  gradient: string;
}

export interface UseCaseCategory {
  id: string;
  labelKey: I18nKey;
}

export interface Video {
  id: string;
  titleKey: I18nKey;
  duration: string;
  gradient: string;
  featured?: boolean;
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface BlogPost {
  id: string;
  titleKey: I18nKey;
  excerptKey: I18nKey;
  date: string;
  author: string;
  gradient: string;
  featured?: boolean;
  slug?: string;
}

export interface ContentData {
  pricing: {
    tiers: PricingTier[];
  };
  useCases: {
    categories: UseCaseCategory[];
    items: UseCase[];
  };
  videos: {
    items: Video[];
  };
  blog: {
    posts: BlogPost[];
  };
}
