import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// This component creates a visually appealing and animated 404 Not Found page.
const NotFound: React.FC = () => {
  const navigate = useNavigate();

  // Animation variants for the main container to orchestrate child animations
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Stagger the animation of children by 0.2s
      },
    },
  };

  // Animation variants for individual text/element items
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  // Animation for the floating '404' digits
  const digitVariants: Variants = {
    initial: { y: 0 },
    animate: (i: number) => ({ // Custom property 'i' for stagger delay
      y: [0, -15, 0],
      transition: {
        delay: i * 0.2,
        duration: 2.5,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      },
    }),
  };

  return (
    <div className="relative flex min-h-100 items-center justify-center overflow-hidden bg-gray-900 text-white">
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          background: [
            'radial-gradient(circle, rgba(29,78,216,0.3) 0%, rgba(29,78,216,0) 60%)',
            'radial-gradient(circle, rgba(107,33,168,0.3) 0%, rgba(107,33,168,0) 60%)',
            'radial-gradient(circle, rgba(29,78,216,0.3) 0%, rgba(29,78,216,0) 60%)',
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="z-10 flex flex-col items-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* The '404' title with floating animation */}
        <motion.div className="flex items-center" variants={itemVariants}>
          {['4', '0', '4'].map((digit, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={digitVariants}
              initial="initial"
              animate="animate"
              className="text-8xl font-extrabold text-blue-400 md:text-9xl"
              style={{ textShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }}
            >
              {digit}
            </motion.span>
          ))}
        </motion.div>

        {/* Page Not Found Heading */}
        <motion.h1
          className="mt-4 text-4xl font-bold tracking-tight md:text-5xl"
          variants={itemVariants}
        >
          Page Not Found
        </motion.h1>

        {/* Descriptive Text */}
        <motion.p
          className="mt-4 max-w-md text-lg text-gray-300"
          variants={itemVariants}
        >
          Oops! It seems you've ventured into uncharted territory. The page you're looking for doesn't exist.
        </motion.p>

        {/* Go Home Button */}
        <motion.button
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:bg-blue-700"
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home size={20} />
          Go Back Home
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NotFound;