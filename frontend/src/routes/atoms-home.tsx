import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { I18nKey } from "#/i18n/declaration";

// Template suggestions like atoms.dev
const TEMPLATES = [
  {
    id: "todo",
    titleKey: I18nKey.ATOMS$TEMPLATE_TODO_TITLE,
    descriptionKey: I18nKey.ATOMS$TEMPLATE_TODO_DESC,
    icon: "✅",
  },
  {
    id: "landing",
    titleKey: I18nKey.ATOMS$TEMPLATE_LANDING_TITLE,
    descriptionKey: I18nKey.ATOMS$TEMPLATE_LANDING_DESC,
    icon: "🚀",
  },
  {
    id: "dashboard",
    titleKey: I18nKey.ATOMS$TEMPLATE_DASHBOARD_TITLE,
    descriptionKey: I18nKey.ATOMS$TEMPLATE_DASHBOARD_DESC,
    icon: "📊",
  },
  {
    id: "portfolio",
    titleKey: I18nKey.ATOMS$TEMPLATE_PORTFOLIO_TITLE,
    descriptionKey: I18nKey.ATOMS$TEMPLATE_PORTFOLIO_DESC,
    icon: "💼",
  },
  {
    id: "ecommerce",
    titleKey: I18nKey.ATOMS$TEMPLATE_ECOMMERCE_TITLE,
    descriptionKey: I18nKey.ATOMS$TEMPLATE_ECOMMERCE_DESC,
    icon: "🛒",
  },
  {
    id: "blog",
    titleKey: I18nKey.ATOMS$TEMPLATE_BLOG_TITLE,
    descriptionKey: I18nKey.ATOMS$TEMPLATE_BLOG_DESC,
    icon: "📝",
  },
];

export default function AtomsHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const createConversation = useCreateConversation();

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isCreating) return;

    setIsCreating(true);
    try {
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
    const description = t(template.descriptionKey);
    const query = `Build a ${title.toLowerCase()}: ${description}`;
    handleSubmit(query);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-base px-4 py-8 overflow-auto">
      {/* Main Content */}
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            {t(I18nKey.ATOMS$HERO_TITLE_PREFIX)}{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {t(I18nKey.ATOMS$HERO_TITLE_HIGHLIGHT)}
            </span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-lg mx-auto">
            {t(I18nKey.ATOMS$HERO_SUBTITLE)}
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full relative">
          <div className="relative flex items-center bg-neutral-800 border border-neutral-700 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-colors">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(I18nKey.ATOMS$INPUT_PLACEHOLDER)}
              className="flex-1 bg-transparent text-white placeholder-neutral-500 px-6 py-5 text-lg outline-none"
              disabled={isCreating}
            />
            <button
              type="button"
              onClick={() => handleSubmit(inputValue)}
              disabled={!inputValue.trim() || isCreating}
              className="mr-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
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
            </button>
          </div>
        </div>

        {/* Templates Section */}
        <div className="w-full space-y-4">
          <h2 className="text-lg font-medium text-neutral-300 text-center">
            {t(I18nKey.ATOMS$TEMPLATES_TITLE)}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TEMPLATES.map((template) => (
              <button
                type="button"
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                disabled={isCreating}
                className="group p-4 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 hover:border-neutral-600 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                      {t(template.titleKey)}
                    </h3>
                    <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
                      {t(template.descriptionKey)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-sm text-neutral-500 text-center">
          {t(I18nKey.ATOMS$FOOTER_POWERED_BY)}{" "}
          <a
            href="https://github.com/All-Hands-AI/OpenHands"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            {t(I18nKey.BRANDING$OPENHANDS)}
          </a>
        </p>
      </div>
    </div>
  );
}
