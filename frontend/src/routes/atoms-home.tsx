import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { I18nKey } from "#/i18n/declaration";
import { autoDetectRole } from "#/api/role-service/role-service.api";

// Atoms Plus: Role detection timeout (ms) - don't block conversation creation too long
const ROLE_DETECTION_TIMEOUT = 2000;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    scale: 1.03,
    y: -6,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.97,
  },
};

// Placeholder text suggestions that rotate
const PLACEHOLDER_SUGGESTIONS = [
  "Create a SaaS subscription app with user login...",
  "Build a portfolio website with dark mode...",
  "Design an e-commerce store with cart...",
  "Make a task management dashboard...",
  "Create a blog platform with comments...",
];

// Template categories like atoms.dev
const TEMPLATE_CATEGORIES = [
  { id: "saas", labelKey: I18nKey.ATOMS$CATEGORY_SAAS },
  { id: "ecommerce", labelKey: I18nKey.ATOMS$CATEGORY_ECOMMERCE },
  { id: "internal", labelKey: I18nKey.ATOMS$CATEGORY_INTERNAL },
  { id: "personal", labelKey: I18nKey.ATOMS$CATEGORY_PERSONAL },
];

// Template cards with images/previews
const TEMPLATES = [
  // SaaS templates
  {
    id: "investment",
    titleKey: I18nKey.ATOMS$TEMPLATE_INVESTMENT_TITLE,
    category: "saas",
    gradient: "from-blue-500/20 to-purple-500/20",
  },
  // Internal templates
  {
    id: "admin-panel",
    titleKey: I18nKey.ATOMS$TEMPLATE_ADMIN_PANEL_TITLE,
    category: "internal",
    gradient: "from-slate-500/20 to-zinc-500/20",
  },
  {
    id: "employee-portal",
    titleKey: I18nKey.ATOMS$TEMPLATE_EMPLOYEE_PORTAL_TITLE,
    category: "internal",
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  {
    id: "inventory-system",
    titleKey: I18nKey.ATOMS$TEMPLATE_INVENTORY_SYSTEM_TITLE,
    category: "internal",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: "hr-dashboard",
    titleKey: I18nKey.ATOMS$TEMPLATE_HR_DASHBOARD_TITLE,
    category: "internal",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  // Personal templates
  {
    id: "manga",
    titleKey: I18nKey.ATOMS$TEMPLATE_MANGA_TITLE,
    category: "personal",
    gradient: "from-pink-500/20 to-orange-500/20",
  },
  {
    id: "fitness",
    titleKey: I18nKey.ATOMS$TEMPLATE_FITNESS_TITLE,
    category: "personal",
    gradient: "from-green-500/20 to-teal-500/20",
  },
  {
    id: "portfolio",
    titleKey: I18nKey.ATOMS$TEMPLATE_PORTFOLIO_TITLE,
    category: "personal",
    gradient: "from-indigo-500/20 to-blue-500/20",
  },
  {
    id: "blog",
    titleKey: I18nKey.ATOMS$TEMPLATE_BLOG_TITLE,
    category: "personal",
    gradient: "from-emerald-500/20 to-cyan-500/20",
  },
];

export default function AtomsHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("saas");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const createConversation = useCreateConversation();

  // Animated placeholder effect
  useEffect(() => {
    // Only run animation when input is empty
    if (inputValue) {
      return undefined;
    }

    const currentText = PLACEHOLDER_SUGGESTIONS[placeholderIndex];
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      // Typing phase: add one character at a time
      if (displayedPlaceholder.length < currentText.length) {
        timeout = setTimeout(() => {
          setDisplayedPlaceholder(
            currentText.slice(0, displayedPlaceholder.length + 1),
          );
        }, 50);
      } else {
        // Finished typing, wait then start deleting
        timeout = setTimeout(() => setIsTyping(false), 2000);
      }
    } else if (displayedPlaceholder.length > 0) {
      // Deleting phase: remove one character at a time
      timeout = setTimeout(() => {
        setDisplayedPlaceholder((prev) => prev.slice(0, -1));
      }, 30);
    } else {
      // Finished deleting, move to next suggestion
      setPlaceholderIndex(
        (prev) => (prev + 1) % PLACEHOLDER_SUGGESTIONS.length,
      );
      setIsTyping(true);
    }

    return () => clearTimeout(timeout);
  }, [placeholderIndex, isTyping, displayedPlaceholder, inputValue]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isCreating) return;

    setIsCreating(true);
    try {
      // Atoms Plus: Auto-detect role for UI display only
      // The actual prompt injection is handled by microagents in .openhands/microagents/
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        ROLE_DETECTION_TIMEOUT,
      );

      try {
        const roleResult = await autoDetectRole(query.trim());
        clearTimeout(timeoutId);
        // Log detected role for UI feedback (microagents handle actual behavior)
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log(
            `[Atoms Plus] Detected role: ${roleResult.role_name} (${roleResult.role_id}) - handled by microagents`,
          );
        }
      } catch (error) {
        clearTimeout(timeoutId);
        // Role detection is optional - microagents still work without it
        if (process.env.NODE_ENV === "development") {
          const reason =
            error instanceof Error && error.name === "AbortError"
              ? "timeout"
              : "error";
          // eslint-disable-next-line no-console
          console.log(`[Atoms Plus] Role detection ${reason} (non-blocking)`);
        }
      }

      // Note: agentRole parameter removed - microagents handle role injection
      const result = await createConversation.mutateAsync({
        query: query.trim(),
      });
      const conversationId = result.conversation_id;
      navigate(`/conversations/${conversationId}`);
    } catch {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputValue);
    }
  };

  const handleTemplateClick = (template: (typeof TEMPLATES)[0]) => {
    const title = t(template.titleKey);
    const query = `Build ${title}`;
    handleSubmit(query);
  };

  return (
    <div className="min-h-full flex flex-col bg-base overflow-auto">
      {/* Main Content */}
      <motion.div
        className="flex-1 flex flex-col items-center px-4 py-12 md:py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div
          className="text-center space-y-6 max-w-4xl mx-auto mb-12"
          variants={itemVariants}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
            {t(I18nKey.ATOMS$HERO_TITLE_PREFIX)}{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t(I18nKey.ATOMS$HERO_TITLE_HIGHLIGHT)}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            {t(I18nKey.ATOMS$HERO_SUBTITLE)}
          </p>
        </motion.div>

        {/* Search Input Section */}
        <motion.div
          className="w-full max-w-2xl mx-auto mb-16"
          variants={itemVariants}
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative flex items-center bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 transition-all duration-300">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  displayedPlaceholder || t(I18nKey.ATOMS$INPUT_PLACEHOLDER)
                }
                className="flex-1 bg-transparent text-white placeholder-neutral-500 px-6 py-5 text-lg outline-none"
                disabled={isCreating}
                aria-label={t(I18nKey.ATOMS$INPUT_PLACEHOLDER)}
              />
              <motion.button
                type="button"
                onClick={() => handleSubmit(inputValue)}
                disabled={!inputValue.trim() || isCreating}
                className="mr-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>{t(I18nKey.ATOMS$BUTTON_CREATING)}</span>
                  </>
                ) : (
                  <>
                    <span>{t(I18nKey.ATOMS$BUTTON_START)}</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Templates Section */}
        <motion.div
          className="w-full max-w-5xl mx-auto space-y-8"
          variants={itemVariants}
        >
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              {t(I18nKey.ATOMS$TEMPLATES_TITLE)}
            </h2>
            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2" role="tablist">
              {TEMPLATE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category.id}
                  onClick={() => setActiveCategory(category.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveCategory(category.id);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
                    activeCategory === category.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                      : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700/50 hover:text-white"
                  }`}
                >
                  {t(category.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Template Cards Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            role="tabpanel"
          >
            <AnimatePresence mode="wait">
              {TEMPLATES.map((template, index) => (
                <motion.button
                  type="button"
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleTemplateClick(template);
                    }
                  }}
                  disabled={isCreating}
                  className="group relative overflow-hidden rounded-2xl bg-neutral-900/50 border border-neutral-700/30 hover:border-indigo-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Card Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}
                  />

                  {/* Card Content */}
                  <div className="relative p-6 h-48 flex flex-col justify-between">
                    <div className="flex justify-end">
                      <span className="px-3 py-1 text-xs font-medium bg-neutral-800/80 text-neutral-300 rounded-full backdrop-blur-sm">
                        {t(I18nKey.ATOMS$REMIX_SESSION)}
                      </span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {t(template.titleKey)}
                      </h3>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="w-full max-w-4xl mx-auto mt-20 text-center"
          variants={itemVariants}
        >
          <p className="text-neutral-500 mb-6">
            {t(I18nKey.ATOMS$POWERED_BY_OPENSOURCE)}
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">
                {t(I18nKey.ATOMS$STAT_GITHUB_STARS_VALUE)}
              </div>
              <div className="text-sm text-neutral-500">
                {t(I18nKey.ATOMS$GITHUB_STARS)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">
                {t(I18nKey.ATOMS$STAT_BUILDERS_VALUE)}
              </div>
              <div className="text-sm text-neutral-500">
                {t(I18nKey.ATOMS$BUILDERS)}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
