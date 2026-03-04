import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/lib/utils";
import { useUseCaseCategories, useUseCases } from "#/hooks/query/use-use-cases";
import type { UseCase } from "#/api/content-service/content-service.types";

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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
};

function UseCaseCard({
  useCase,
  t,
}: {
  useCase: UseCase;
  t: (key: string) => string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      whileHover="hover"
      layout
      className={cn(
        "group relative overflow-hidden rounded-2xl p-6",
        "bg-neutral-900/50 border border-neutral-700/30",
        "hover:border-indigo-500/50 transition-colors cursor-pointer",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          useCase.gradient,
        )}
      />
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
          {t(useCase.titleKey)}
        </h3>
        <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
          {t(useCase.descriptionKey)}
        </p>
        <div className="flex items-center text-sm text-indigo-400 font-medium">
          {t(I18nKey.ATOMS$RESOURCES_USECASE_READ_MORE)}
          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

export default function UseCasesPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: categories, isLoading: categoriesLoading } =
    useUseCaseCategories();
  const { data: useCases, isLoading: useCasesLoading } = useUseCases();

  const isLoading = categoriesLoading || useCasesLoading;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-base">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const filteredUseCases =
    activeCategory === "all"
      ? useCases || []
      : (useCases || []).filter((uc) => uc.category === activeCategory);

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
            {t(I18nKey.ATOMS$RESOURCES_USECASES_TITLE)}
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            {t(I18nKey.ATOMS$RESOURCES_USECASES_SUBTITLE)}
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-12"
          variants={itemVariants}
        >
          {categories?.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700/50 hover:text-white",
              )}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </motion.div>

        {/* Use Cases Grid */}
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredUseCases.map((useCase) => (
              <UseCaseCard key={useCase.id} useCase={useCase} t={t} />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
