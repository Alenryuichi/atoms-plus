import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <motion.div
      className="inline-flex items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-neutral-400"
          animate={{ y: [0, -5, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            delay: i * 0.12,
            ease: [0.45, 0, 0.55, 1],
          }}
        />
      ))}
    </motion.div>
  );
}
