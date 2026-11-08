import React from "react";
import { motion } from "framer-motion";
import { useMotionPreset } from "./motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Global Page Transition.
 * 160ms fade + 6px rise on route change.
 * Sidebar remains static; scroll is restored smoothly.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = "" }) => {
  const pageVariants = useMotionPreset("page");

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};
