import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Check, X, Zap, Loader2 } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { usePricingTiers } from "#/hooks/query/use-pricing";
import type { PricingTier } from "#/api/content-service/content-service.types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
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

function PricingCard({
  tier,
  t,
}: {
  tier: PricingTier;
  t: (key: string) => string;
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "relative flex flex-col rounded-2xl p-6 md:p-8",
        "bg-neutral-900/50 border transition-all duration-300",
        tier.highlighted
          ? "border-indigo-500/50 shadow-lg shadow-indigo-500/20"
          : "border-neutral-700/30 hover:border-neutral-600/50",
      )}
    >
      {tier.badgeKey && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full">
            {t(tier.badgeKey)}
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          {t(tier.nameKey)}
        </h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-white">{tier.price}</span>
          <span className="text-neutral-400">{tier.period}</span>
        </div>
      </div>

      <ul className="flex-1 space-y-3 mb-6">
        {tier.features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-3">
            {feature.included ? (
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <X className="h-5 w-5 text-neutral-600 flex-shrink-0" />
            )}
            <span
              className={cn(
                "text-sm",
                feature.included ? "text-neutral-300" : "text-neutral-500",
              )}
            >
              {t(feature.key)}
            </span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => navigate("/login?signup=true")}
        className={cn(
          "w-full py-3 font-semibold rounded-xl transition-all duration-300",
          tier.highlighted
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
            : "bg-neutral-800 hover:bg-neutral-700 text-white",
        )}
      >
        {t(tier.ctaKey)}
      </Button>
    </motion.div>
  );
}

export default function PricingPage() {
  const { t } = useTranslation();
  const { data: tiers, isLoading } = usePricingTiers();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-base">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

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
          className="text-center space-y-4 max-w-3xl mx-auto mb-16"
          variants={itemVariants}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Zap className="h-4 w-4 text-indigo-400" />
            <span className="text-sm text-indigo-400 font-medium">
              {t(I18nKey.ATOMS$PRICING_BADGE)}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {t(I18nKey.ATOMS$PRICING_HERO_TITLE)}
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            {t(I18nKey.ATOMS$PRICING_HERO_SUBTITLE)}
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20">
          {tiers?.map((tier) => (
            <PricingCard key={tier.id} tier={tier} t={t} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
