import { useQuery } from "@tanstack/react-query";
import ContentService from "#/api/content-service/content-service.api";

export const PRICING_QUERY_KEY = "pricing";

export const usePricingTiers = () =>
  useQuery({
    queryKey: [PRICING_QUERY_KEY, "tiers"],
    queryFn: ContentService.getPricingTiers,
    staleTime: 1000 * 60 * 60, // 1 hour (static content)
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
