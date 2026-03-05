import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { ShuffleText } from "#/components/ui/shuffle-text";
import { StarBorder } from "#/components/ui/star-border";
import { CountUp } from "#/components/ui/count-up";
import { DarkVeil } from "#/components/ui/dark-veil";
import { ScaffoldBentoGrid } from "#/components/features/scaffolding";
import { I18nKey } from "#/i18n/declaration";
import { autoDetectRole } from "#/api/role-service/role-service.api";

// Atoms Plus: Role detection timeout (ms) - don't block conversation creation too long
const ROLE_DETECTION_TIMEOUT = 2000;

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Card hover animation variants (still using Framer Motion for hover/tap)
const cardVariants = {
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

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero parallax effect - background moves slower than content
      if (heroRef.current) {
        gsap.to(heroRef.current, {
          yPercent: -30,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      // Hero content parallax - moves slightly faster for depth
      if (heroContentRef.current) {
        gsap.to(heroContentRef.current, {
          yPercent: -15,
          ease: "none",
          scrollTrigger: {
            trigger: heroContentRef.current,
            start: "top 20%",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }

      // Scroll reveal for all sections
      ScrollTrigger.batch(".scroll-reveal", {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            {
              y: 80,
              opacity: 0,
              scale: 0.95,
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 1,
              stagger: 0.15,
              ease: "power3.out",
              overwrite: true,
            },
          );
        },
        onLeave: (elements) => {
          gsap.to(elements, {
            opacity: 0.7,
            scale: 0.98,
            duration: 0.3,
          });
        },
        onEnterBack: (elements) => {
          gsap.to(elements, {
            opacity: 1,
            scale: 1,
            duration: 0.3,
          });
        },
        start: "top 85%",
        end: "bottom 15%",
      });

      // Staggered reveal for template cards
      ScrollTrigger.batch(".scroll-reveal-card", {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            {
              y: 60,
              opacity: 0,
              scale: 0.9,
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: "back.out(1.2)",
              overwrite: true,
            },
          );
        },
        start: "top 90%",
      });

      // Stats section - count up trigger
      ScrollTrigger.create({
        trigger: ".stats-section",
        start: "top 80%",
        onEnter: () => {
          gsap.fromTo(
            ".stat-item",
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.2,
              ease: "power2.out",
            },
          );
        },
        once: true,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

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
    <div
      ref={containerRef}
      className="min-h-full flex flex-col overflow-auto relative"
    >
      {/* Animated WebGL Background with parallax */}
      <div
        ref={heroRef}
        className="fixed inset-0 w-full h-full will-change-transform"
        style={{ zIndex: -1 }}
      >
        <DarkVeil
          hueShift={30}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.6}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-12 md:py-20 relative z-10">
        {/* Hero Section with parallax content */}
        <div
          ref={heroContentRef}
          className="text-center space-y-6 max-w-4xl mx-auto mb-12 will-change-transform"
        >
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {t(I18nKey.ATOMS$HERO_TITLE_PREFIX)}{" "}
            <ShuffleText
              text={t(I18nKey.ATOMS$HERO_TITLE_HIGHLIGHT)}
              className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent"
              tag="span"
              duration={40}
              triggerOnHover
            />
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {t(I18nKey.ATOMS$HERO_SUBTITLE)}
          </motion.p>
        </div>

        {/* Search Input Section - scroll reveal */}
        <motion.div
          className="scroll-reveal w-full max-w-2xl mx-auto mb-16 will-change-transform"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative flex items-center bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-2xl overflow-hidden focus-within:border-amber-500/50 transition-all duration-300">
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
              <StarBorder
                as="button"
                type="button"
                onClick={() => handleSubmit(inputValue)}
                disabled={!inputValue.trim() || isCreating}
                className="mr-3"
                color="#d4a855"
                speed="4s"
              >
                <motion.span
                  className="flex items-center gap-2 font-semibold"
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
                </motion.span>
              </StarBorder>
            </div>
          </div>
        </motion.div>

        {/* Templates Section - scroll reveal */}
        <div className="scroll-reveal w-full max-w-5xl mx-auto space-y-8 will-change-transform">
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

          {/* Template Cards Grid - scroll reveal cards */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            role="tabpanel"
          >
            <AnimatePresence mode="wait">
              {TEMPLATES.map((template) => (
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
                  className="scroll-reveal-card group relative overflow-hidden rounded-2xl bg-neutral-900/50 border border-neutral-700/30 hover:border-amber-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-neutral-900 will-change-transform"
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap="tap"
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
                      <h3 className="text-lg font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {t(template.titleKey)}
                      </h3>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Scaffold Templates Bento Grid - scroll reveal */}
        <div className="scroll-reveal w-full max-w-5xl mx-auto mt-16 space-y-6 will-change-transform">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              {t(I18nKey.ATOMS$SCAFFOLD_TITLE) || "Quick Start Templates"}
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              {t(I18nKey.ATOMS$SCAFFOLD_DESCRIPTION) ||
                "Generate a complete project with your favorite framework in seconds"}
            </p>
          </div>
          <ScaffoldBentoGrid />
        </div>

        {/* Stats Section - scroll reveal with GSAP */}
        <div className="stats-section scroll-reveal w-full max-w-4xl mx-auto mt-20 text-center will-change-transform">
          <p className="text-neutral-500 mb-6">
            {t(I18nKey.ATOMS$POWERED_BY_OPENSOURCE)}
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="stat-item text-center">
              <div className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center">
                <CountUp
                  to={100}
                  from={0}
                  duration={2.5}
                  delay={0.2}
                  separator=","
                  className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent"
                />
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  K+
                </span>
              </div>
              <div className="text-sm text-neutral-500">
                {t(I18nKey.ATOMS$GITHUB_STARS)}
              </div>
            </div>
            <div className="stat-item text-center">
              <div className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center">
                <CountUp
                  to={1}
                  from={0}
                  duration={2}
                  delay={0.4}
                  className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent"
                />
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  M+
                </span>
              </div>
              <div className="text-sm text-neutral-500">
                {t(I18nKey.ATOMS$BUILDERS)}
              </div>
            </div>
            <div className="stat-item text-center">
              <div className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center">
                <CountUp
                  to={50}
                  from={0}
                  duration={2.2}
                  delay={0.6}
                  separator=","
                  className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent"
                />
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  +
                </span>
              </div>
              <div className="text-sm text-neutral-500">
                {t(I18nKey.ATOMS$CONTRIBUTORS) || "Contributors"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
