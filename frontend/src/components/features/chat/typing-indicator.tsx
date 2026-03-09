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
      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-md border border-amber-500/30 shadow-xl shadow-black/30"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="w-2 h-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/50"
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
      <span className="ml-1 text-xs font-medium text-amber-400/80 tracking-wide">
        {t(I18nKey.AGENT_STATUS$THINKING)}
      </span>
    </motion.div>
  );
}
