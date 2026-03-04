import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, User, Loader2 } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/lib/utils";
import { useBlogPosts } from "#/hooks/query/use-blog-posts";
import type { BlogPost } from "#/api/content-service/content-service.types";

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

function BlogCard({
  post,
  t,
  featured = false,
}: {
  post: BlogPost;
  t: (key: string) => string;
  featured?: boolean;
}) {
  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl cursor-pointer",
        "bg-neutral-900/50 border border-neutral-700/30",
        "hover:border-indigo-500/50 transition-all duration-300",
        featured ? "md:col-span-2" : "",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          post.gradient,
        )}
      />
      <div className={cn("relative z-10 p-6", featured ? "md:p-8" : "")}>
        {post.featured && (
          <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded-full mb-4">
            {t(I18nKey.ATOMS$RESOURCES_BLOG_FEATURED)}
          </span>
        )}
        <h3
          className={cn(
            "font-semibold text-white mb-3 group-hover:text-indigo-300 transition-colors",
            featured ? "text-2xl md:text-3xl" : "text-lg",
          )}
        >
          {t(post.titleKey)}
        </h3>
        <p
          className={cn(
            "text-neutral-400 mb-4 line-clamp-2",
            featured ? "text-base" : "text-sm",
          )}
        >
          {t(post.excerptKey)}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center text-sm text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            {t(I18nKey.ATOMS$RESOURCES_BLOG_READ_MORE)}
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function BlogPage() {
  const { t } = useTranslation();
  const { data: posts, isLoading } = useBlogPosts();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-base">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const featuredPost = posts?.find((p) => p.featured);
  const recentPosts = posts?.filter((p) => !p.featured) || [];

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
            {t(I18nKey.ATOMS$RESOURCES_BLOG_TITLE)}
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            {t(I18nKey.ATOMS$RESOURCES_BLOG_SUBTITLE)}
          </p>
        </motion.div>

        {/* Blog Grid */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredPost && <BlogCard post={featuredPost} t={t} featured />}
          {recentPosts.map((post) => (
            <BlogCard key={post.id} post={post} t={t} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
