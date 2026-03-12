import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";

/**
 * Modern typing indicator with smooth wave animation
 * Uses Framer Motion for GPU-accelerated animations
 */
export function TypingIndicator() {
  const { t } = useTranslation();
  // Stagger animation for wave effect
  const dotVariants = {
    initial: { y: 0, opacity: 0.4 },
    animate: { y: 0, opacity: 1 },
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-white/70 backdrop-blur-md"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-2 w-2 rounded-full bg-white/70"
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 0.6,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
      <span className="ml-1 text-xs font-medium uppercase tracking-[0.16em] text-white/48">
        {t(I18nKey.AGENT_STATUS$THINKING)}
      </span>
    </motion.div>
  );
}
