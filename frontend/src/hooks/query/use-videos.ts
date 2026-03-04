import { useQuery } from "@tanstack/react-query";
import ContentService from "#/api/content-service/content-service.api";

export const VIDEOS_QUERY_KEY = "videos";

export const useVideos = () =>
  useQuery({
    queryKey: [VIDEOS_QUERY_KEY],
    queryFn: ContentService.getVideos,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
