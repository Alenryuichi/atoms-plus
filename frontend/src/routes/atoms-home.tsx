import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { useScaffoldingPresets } from "#/hooks/query/use-scaffolding-presets";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { useScaffoldingTemplates } from "#/hooks/query/use-scaffolding-templates";
import { ShuffleText } from "#/components/ui/shuffle-text";
import { StarBorder } from "#/components/ui/star-border";
import { CountUp } from "#/components/ui/count-up";
import { DarkVeil } from "#/components/ui/dark-veil";
import {
  ScaffoldWizard,
  ScaffoldingPreset,
  TemplateDetailsModal,
  TemplatePreviewSurface,
} from "#/components/features/scaffolding";
import { I18nKey } from "#/i18n/declaration";
import { useTeamModeStore } from "#/stores/team-mode-store";
import { useInitialQueryStore } from "#/stores/initial-query-store";
import { useResearchStore } from "#/stores/research-store";
import { useResearchWebSocket } from "#/hooks/use-research-websocket";
import { ResearchToggle } from "#/components/features/research/research-toggle";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Card hover animation variants (still using Framer Motion for hover/tap)
const cardVariants: Variants = {
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

const CATEGORY_GRADIENTS: Record<string, string> = {
  saas: "from-blue-500/20 to-purple-500/20",
  ecommerce: "from-rose-500/20 to-orange-500/20",
  internal: "from-slate-500/20 to-zinc-500/20",
  personal: "from-emerald-500/20 to-cyan-500/20",
};

const FALLBACK_PRESETS: ScaffoldingPreset[] = [
  {
    id: "saas-starter",
    title: "SaaS Starter",
    description:
      "Authentication, dashboard shell, billing-ready foundation, and marketing pages.",
    category: "saas",
    templateId: "nextjs-app-router",
    previewImage: "/template-preview-saas-starter.svg",
    tags: ["saas", "dashboard", "auth", "starter"],
    defaultConfig: {
      projectType: "nextjs",
      uiLibrary: "shadcn",
      features: ["typescript", "auth", "dark-mode", "responsive"],
      description:
        "A SaaS starter with auth, dashboard, and polished landing pages.",
      packageManager: "pnpm",
    },
    supportedOverrides: {
      uiLibrary: true,
      features: true,
      projectName: true,
      description: true,
      packageManager: true,
    },
  },
  {
    id: "admin-dashboard",
    title: "Admin Dashboard",
    description:
      "Internal tooling starter with analytics widgets, CRUD surfaces, and role-oriented layout.",
    category: "internal",
    templateId: "react-vite-ts",
    previewImage: "/template-preview-admin-dashboard.svg",
    tags: ["admin", "dashboard", "internal", "analytics"],
    defaultConfig: {
      projectType: "react-vite",
      uiLibrary: "shadcn",
      features: ["typescript", "dark-mode", "responsive", "testing"],
      description:
        "An internal admin dashboard starter with analytics and data management surfaces.",
      packageManager: "pnpm",
    },
    supportedOverrides: {
      uiLibrary: true,
      features: true,
      projectName: true,
      description: true,
      packageManager: true,
    },
  },
  {
    id: "blog",
    title: "Blog",
    description:
      "Content-driven site starter with article pages, author sections, and polished reading experience.",
    category: "personal",
    templateId: "nextjs-app-router",
    previewImage: "/template-preview-blog.svg",
    tags: ["blog", "content", "writing", "seo"],
    defaultConfig: {
      projectType: "nextjs",
      uiLibrary: "tailwind",
      features: ["typescript", "dark-mode", "i18n", "responsive"],
      description:
        "A content-first blog starter with featured articles and author pages.",
      packageManager: "npm",
    },
    supportedOverrides: {
      uiLibrary: true,
      features: true,
      projectName: true,
      description: true,
      packageManager: true,
    },
  },
  {
    id: "portfolio",
    title: "Portfolio",
    description:
      "Personal showcase with hero storytelling, selected work, and contact sections.",
    category: "personal",
    templateId: "react-vite-ts",
    previewImage: "/template-preview-portfolio.svg",
    tags: ["portfolio", "personal", "showcase", "landing"],
    defaultConfig: {
      projectType: "react-vite",
      uiLibrary: "tailwind",
      features: ["typescript", "dark-mode", "responsive"],
      description:
        "A polished portfolio starter for showcasing work, testimonials, and contact info.",
      packageManager: "npm",
    },
    supportedOverrides: {
      uiLibrary: true,
      features: true,
      projectName: true,
      description: true,
      packageManager: true,
    },
  },
];

type TemplateFlow = "idle" | "details" | "wizard";

export default function AtomsHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("saas");
  const [selectedPreset, setSelectedPreset] = useState<
    ScaffoldingPreset | undefined
  >(undefined);
  const [templateFlow, setTemplateFlow] = useState<TemplateFlow>("idle");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const presetCardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const preventDetailsCloseAutoFocusRef = useRef(false);
  const createConversation = useCreateConversation();
  const {
    data: presetsData,
    isLoading: isPresetsLoading,
    error: presetsError,
  } = useScaffoldingPresets();
  const { data: templatesData, isLoading: isTemplatesLoading } =
    useScaffoldingTemplates();
  // Team Mode: Access store to check if enabled
  const isTeamModeEnabled = useTeamModeStore((state) => state.isEnabled);
  const setInitialPrompt = useInitialQueryStore(
    (state) => state.setInitialPrompt,
  );
  const presets =
    presetsData?.presets?.length && !presetsError
      ? presetsData.presets
      : FALLBACK_PRESETS;
  const visibleCategories = TEMPLATE_CATEGORIES.filter((category) =>
    presets.some((preset) => preset.category === category.id),
  );
  const visiblePresets = presets.filter(
    (preset) => preset.category === activeCategory,
  );
  const areTemplateOptionsReady =
    !!templatesData?.templates?.length && !isTemplatesLoading;

  useEffect(() => {
    if (!visibleCategories.length) {
      return;
    }

    if (!visibleCategories.some((category) => category.id === activeCategory)) {
      setActiveCategory(visibleCategories[0].id);
    }
  }, [activeCategory, visibleCategories]);

  const restorePresetFocus = (presetId?: string) => {
    if (!presetId) {
      return;
    }

    requestAnimationFrame(() => {
      presetCardRefs.current[presetId]?.focus();
    });
  };

  // Deep Research
  const { isResearchMode, phase: researchPhase, reset: resetResearch } = useResearchStore();
  const { connect: startResearchWs } = useResearchWebSocket();

  // Only clear fully-terminal research states on returning to home.
  // "error" is kept so the user can see what went wrong.
  useEffect(() => {
    if (researchPhase === "completed" || researchPhase === "awaiting_confirmation") {
      resetResearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+Shift+D to toggle Deep Research mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const store = useResearchStore.getState();
        store.setResearchMode(!store.isResearchMode);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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

    // Deep Research mode: start WS research + create conversation WITHOUT query.
    // The agent won't execute until the user reviews the report and clicks
    // "Start Build" on the conversation page (handled by chat-interface.tsx).
    if (isResearchMode && (researchPhase === "idle" || researchPhase === "error" || researchPhase === "completed" || researchPhase === "awaiting_confirmation")) {
      const trimmed = query.trim();
      startResearchWs(trimmed);
      setIsCreating(true);
      try {
        const result = await createConversation.mutateAsync({
          // Don't pass query — agent should wait for "Start Build" confirmation
        });
        const conversationId = result.conversation_id;
        navigate(`/conversations/${conversationId}`);
      } catch {
        setIsCreating(false);
      }
      return;
    }

    setIsCreating(true);
    try {
      // Team Mode: When enabled, create conversation WITHOUT the initial query
      // Store the query in initialQueryStore so chat-interface can handle it
      // This ensures the first message goes through Team Mode API
      if (isTeamModeEnabled) {
        setInitialPrompt(query.trim());
        const result = await createConversation.mutateAsync({
          // Don't pass query - let chat-interface handle it via Team Mode
        });
        const conversationId = result.conversation_id;
        navigate(`/conversations/${conversationId}`);
      } else {
        // Normal flow: create conversation WITH initial query
        const result = await createConversation.mutateAsync({
          query: query.trim(),
        });
        const conversationId = result.conversation_id;
        navigate(`/conversations/${conversationId}`);
      }
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

  const handleTemplateClick = (preset: ScaffoldingPreset) => {
    setSelectedPreset(preset);
    setTemplateFlow("details");
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
            <div className="relative bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-2xl overflow-hidden focus-within:border-amber-500/50 transition-all duration-300">
              <div className="flex items-center">
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
                  disabled={isCreating || (researchPhase !== "idle" && researchPhase !== "completed" && researchPhase !== "awaiting_confirmation" && researchPhase !== "error")}
                  aria-label={t(I18nKey.ATOMS$INPUT_PLACEHOLDER)}
                />
                <StarBorder
                  as="button"
                  type="button"
                  onClick={() => handleSubmit(inputValue)}
                  disabled={!inputValue.trim() || isCreating || (researchPhase !== "idle" && researchPhase !== "completed" && researchPhase !== "awaiting_confirmation" && researchPhase !== "error")}
                  className="mr-3"
                  color={isResearchMode ? "#f59e0b" : "#d4a855"}
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
                    ) : isResearchMode ? (
                      <>
                        <span>🔬</span>
                        <span>Research</span>
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
              {/* Research toggle row */}
              <div className="flex items-center gap-2 px-5 pb-3 pt-0">
                <ResearchToggle />
                {isResearchMode && (
                  <span className="text-xs text-white/30">
                    {t(I18nKey.ATOMS$RESEARCH_HINT)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Templates Section - scroll reveal */}
        <div className="scroll-reveal w-full max-w-5xl mx-auto space-y-8 will-change-transform">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              {t(I18nKey.ATOMS$TEMPLATES_TITLE)}
            </h2>
            {/* Homepage marketing copy intentionally stays product-authored here. */}
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Pick a real starter, configure it, and jump straight into a live
              conversation workspace.
            </p>
            {isPresetsLoading && !presetsData ? (
              <>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <p className="text-sm text-neutral-500">
                  Loading starter templates...
                </p>
              </>
            ) : null}
            {presetsError ? (
              <>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <p className="text-sm text-amber-300/80">
                  Preset catalog is temporarily unavailable. Showing built-in
                  starters.
                </p>
              </>
            ) : null}
            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2" role="tablist">
              {visibleCategories.map((category) => (
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
            {visiblePresets.map((preset) => (
              <motion.button
                type="button"
                key={preset.id}
                ref={(element) => {
                  presetCardRefs.current[preset.id] = element;
                }}
                onClick={() => handleTemplateClick(preset)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleTemplateClick(preset);
                  }
                }}
                disabled={isCreating}
                aria-label={`Open ${preset.title} template`}
                className="scroll-reveal-card group relative overflow-hidden rounded-2xl border border-neutral-700/30 bg-neutral-900/50 text-left transition-all duration-300 hover:border-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-neutral-900 will-change-transform"
                variants={cardVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {/* Card Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    CATEGORY_GRADIENTS[preset.category] ??
                    "from-indigo-500/20 to-blue-500/20"
                  } opacity-50 group-hover:opacity-70 transition-opacity duration-300`}
                />

                {/* Card Content */}
                <div className="relative flex min-h-[21rem] flex-col gap-4 p-4">
                  <div className="flex justify-between items-start gap-3">
                    <span className="px-3 py-1 text-xs font-medium bg-neutral-800/80 text-neutral-300 rounded-full backdrop-blur-sm">
                      {preset.category}
                    </span>
                    <span className="px-3 py-1 text-xs font-medium bg-neutral-800/80 text-neutral-300 rounded-full backdrop-blur-sm">
                      {preset.defaultConfig?.uiLibrary ?? "template"}
                    </span>
                  </div>
                  <TemplatePreviewSurface preset={preset} />
                  <div className="text-left mt-auto">
                    <h3 className="text-lg font-semibold text-white group-hover:text-amber-300 transition-colors">
                      {preset.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-400 leading-relaxed line-clamp-3">
                      {preset.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {preset.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-medium text-neutral-300/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
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
                  {t(I18nKey.ATOMS$UNIT_K_PLUS)}
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
                  {t(I18nKey.ATOMS$UNIT_M_PLUS)}
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
                  {t(I18nKey.ATOMS$UNIT_PLUS)}
                </span>
              </div>
              <div className="text-sm text-neutral-500">
                {t(I18nKey.ATOMS$CONTRIBUTORS)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TemplateDetailsModal
        preset={selectedPreset}
        isOpen={templateFlow === "details"}
        isContinueReady={areTemplateOptionsReady}
        preventCloseAutoFocusRef={preventDetailsCloseAutoFocusRef}
        onClose={() => {
          preventDetailsCloseAutoFocusRef.current = false;
          const presetId = selectedPreset?.id;
          setTemplateFlow("idle");
          setSelectedPreset(undefined);
          restorePresetFocus(presetId);
        }}
        onContinue={() => {
          preventDetailsCloseAutoFocusRef.current = true;
          setTemplateFlow("wizard");
        }}
      />

      <ScaffoldWizard
        isOpen={templateFlow === "wizard"}
        onClose={() => {
          const presetId = selectedPreset?.id;
          setTemplateFlow("idle");
          setSelectedPreset(undefined);
          restorePresetFocus(presetId);
        }}
        initialPresetId={selectedPreset?.id}
        initialTemplateId={selectedPreset?.templateId}
        initialConfig={
          selectedPreset?.defaultConfig
            ? {
                projectType: selectedPreset.defaultConfig.projectType,
                uiLibrary: selectedPreset.defaultConfig.uiLibrary,
                features: selectedPreset.defaultConfig.features,
                description: selectedPreset.defaultConfig.description,
                packageManager:
                  selectedPreset.defaultConfig.packageManager ?? "npm",
              }
            : undefined
        }
      />
    </div>
  );
}
