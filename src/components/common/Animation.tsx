import React from "react";
import { motion, type Variants } from "framer-motion";

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

export const containerVariants: Variants = { // <-- ADDED TYPE ANNOTATION
  hidden: { opacity: 0 },
  visible: {
      opacity: 1,
      transition: {
          staggerChildren: 0.08,
      }
  }
};

export const pageVariants: Variants = {
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

export const cardVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20
    },
    in: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeInOut"
        }
    }
};

export const imageTransitionVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.9,
  }),
};


export const listVariants: Variants= {
  visible: {
      opacity: 1,
      transition: {
          when: "beforeChildren",
          staggerChildren: 0.05,
      },
  },
  hidden: {
      opacity: 0,
      transition: {
          when: "afterChildren",
      },
  },
};

export const optionVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

export const tableBodyVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

export const tableRowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const accordionVariants: Variants = {
    open: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeInOut' } },
    collapsed: { opacity: 0, height: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
};

export const toastVariants: Variants= {
    initial: { opacity: 0, y: -20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: 50, scale: 0.8 },
};

export const popupVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 20, stiffness: 300 } },
  exit: { opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }
};

export const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { delay: 0.1, duration: 0.2 } },
};

export const pageWithStaggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const headerVariants: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 1, 0.5, 1],
    },
  },
};

export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 1, 0.5, 1],
    },
  },
};

export const bouncyButtonVariants: Variants = {
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 10,
    },
  },
  tap: {
    scale: 0.95
  }
}

export const bouncyComponentVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200,
    }
  }
};

export const bouncyModalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 300,
    },
  },
  exit: { opacity: 0, scale: 0.8 },
};

export const svgVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: { delay: i * 0.2, type: "spring", duration: 1.5, bounce: 0 },
            opacity: { delay: i * 0.2, duration: 0.01 }
        }
    })
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
      variants={pageWithStaggerVariants}
    >
      {children}
    </motion.div>
  );
};

export default Animation;