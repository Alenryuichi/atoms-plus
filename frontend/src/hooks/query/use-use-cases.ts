import { useQuery } from "@tanstack/react-query";
import ContentService from "#/api/content-service/content-service.api";

export const USE_CASES_QUERY_KEY = "useCases";

export const useUseCaseCategories = () =>
  useQuery({
    queryKey: [USE_CASES_QUERY_KEY, "categories"],
    queryFn: ContentService.getUseCaseCategories,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

export const useUseCases = () =>
  useQuery({
    queryKey: [USE_CASES_QUERY_KEY, "items"],
    queryFn: ContentService.getUseCases,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
