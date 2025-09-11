import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { motion } from 'framer-motion';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

const ErrorDisplay = ({ message, onRetry }: ErrorDisplayProps) => {
  const { theme } = useTheme();
  const textHeader = theme === "dark" ? "text-white" : "text-gray-900";
  // const borderPrimary = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  // const bgCard = theme === 'dark' ? 'bg-gray-800/50' : 'bg-white';

  return (
    <motion.div
      className={`rounded-xl p-6 flex flex-col items-center justify-center text-center`}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ willChange: 'transform, opacity' }}
      role="alert"
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 0.9, rotate: -5 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      >
        <AlertCircle className={`w-12 h-12 mb-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
      </motion.div>
      <p className={`font-semibold text-base mb-2 ${textHeader}`}>
        An Error Occurred
      </p>
      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        {message}
      </p>
      <motion.button
        onClick={onRetry}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-4 focus:ring-violet-500/30 ${theme === 'dark' ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-violet-500 hover:bg-violet-600 text-white'}`}
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -1 }}
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </motion.button>
    </motion.div>
  );
};

export default ErrorDisplay;