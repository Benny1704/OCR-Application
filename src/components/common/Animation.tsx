import React from "react";
import { motion, type Variants } from "framer-motion";

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export const containerVariants: Variants = { // <-- ADDED TYPE ANNOTATION
  hidden: { opacity: 0 },
  visible: {
      opacity: 1,
      transition: {
          staggerChildren: 0.15,
      }
  }
};

const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    x: "-100vw",
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "tween",
      ease: "anticipate",
      duration: 0.5,
      staggerChildren: 0.15,
    },
  },
  exit: {
    opacity: 0,
    x: "100vw",
    transition: { 
        type: "tween",
        ease: "anticipate",
        duration: 0.5 
    },
  },
};

interface AnimationProps {
    children: React.ReactNode;
}

const Animation = ({ children }: AnimationProps) => {
  return (
    <motion.div
      // These props are for the main page transition
      initial="hidden"
      animate="visible"
      exit="exit"
      // The variants contain both page transition and stagger logic
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
};

export default Animation;