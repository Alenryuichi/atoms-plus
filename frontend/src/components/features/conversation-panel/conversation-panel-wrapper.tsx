import ReactDOM from "react-dom";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "#/lib/utils";

interface ConversationPanelWrapperProps {
  isOpen: boolean;
}

// Animation variants for the overlay backdrop
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

// Animation variants for the panel slide-in
const panelVariants = {
  hidden: {
    x: -20,
    opacity: 0,
    scale: 0.98,
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    x: -20,
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export function ConversationPanelWrapper({
  isOpen,
  children,
}: React.PropsWithChildren<ConversationPanelWrapperProps>) {
  const { pathname } = useLocation();

  const portalTarget = document.getElementById("root-outlet");
  if (!portalTarget) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "absolute h-full w-full left-0 top-0 z-[100] bg-black/80 rounded-xl",
            pathname === "/" && "bottom-0 top-0 h-auto",
          )}
        >
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="h-full"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget,
  );
}
