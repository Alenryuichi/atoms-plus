import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { IconPlayerPlay, IconClock, IconLoader2 } from "@tabler/icons-react";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/lib/utils";
import { useVideos } from "#/hooks/query/use-videos";
import type { Video } from "#/api/content-service/content-service.types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

function VideoCard({
  video,
  t,
  large = false,
}: {
  video: Video;
  t: (key: string) => string;
  large?: boolean;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl cursor-pointer",
        "bg-neutral-900/50 border border-neutral-700/30",
        "hover:border-indigo-500/50 transition-all duration-300",
        large ? "aspect-video" : "aspect-video",
      )}
    >
      <div
        className={cn("absolute inset-0 bg-gradient-to-br", video.gradient)}
      />

      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm",
            "group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300",
            large ? "w-20 h-20" : "w-14 h-14",
          )}
        >
          <IconPlayerPlay
            size={large ? 32 : 24}
            stroke={1.5}
            className="text-white fill-white"
          />
        </div>
      </div>

      {/* Video Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <h3
          className={cn(
            "font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors",
            large ? "text-xl" : "text-sm",
          )}
        >
          {t(video.titleKey)}
        </h3>
        <div className="flex items-center gap-1 text-neutral-400">
          <IconClock size={12} stroke={1.5} />
          <span className="text-xs">{video.duration}</span>
        </div>
      </div>

      {video.featured && (
        <div className="absolute top-4 left-4">
          <span className="px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded-full">
            {t(I18nKey.ATOMS$RESOURCES_VIDEOS_FEATURED)}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function VideosPage() {
  const { t } = useTranslation();
  const { data: videos, isLoading } = useVideos();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-base">
        <IconLoader2
          size={32}
          stroke={1.5}
          className="animate-spin text-indigo-500"
        />
      </div>
    );
  }

  const featuredVideo = videos?.find((v) => v.featured);
  const recentVideos = videos?.filter((v) => !v.featured) || [];

  return (
    <div className="h-full flex flex-col bg-base overflow-auto">
      <motion.div
        className="flex-1 flex flex-col items-center px-4 py-16 md:py-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div
          className="text-center space-y-4 max-w-3xl mx-auto mb-12"
          variants={itemVariants}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {t(I18nKey.ATOMS$RESOURCES_VIDEOS_TITLE)}
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            {t(I18nKey.ATOMS$RESOURCES_VIDEOS_SUBTITLE)}
          </p>
        </motion.div>

        {/* Featured Video */}
        {featuredVideo && (
          <div className="w-full max-w-4xl mx-auto mb-12">
            <VideoCard video={featuredVideo} t={t} large />
          </div>
        )}

        {/* Recent Videos */}
        <motion.div
          className="w-full max-w-6xl mx-auto"
          variants={itemVariants}
        >
          <h2 className="text-2xl font-semibold text-white mb-6">
            {t(I18nKey.ATOMS$RESOURCES_VIDEOS_RECENT)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentVideos.map((video) => (
              <VideoCard key={video.id} video={video} t={t} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
