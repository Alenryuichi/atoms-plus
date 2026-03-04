import { useQuery } from "@tanstack/react-query";
import ContentService from "#/api/content-service/content-service.api";

export const BLOG_POSTS_QUERY_KEY = "blogPosts";

export const useBlogPosts = () =>
  useQuery({
    queryKey: [BLOG_POSTS_QUERY_KEY],
    queryFn: ContentService.getBlogPosts,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
