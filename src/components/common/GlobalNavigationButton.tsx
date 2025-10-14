import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useNavigation } from '../../contexts/NavigationContext';
import { useTheme } from '../../hooks/useTheme';

const GlobalNavigationButtons: React.FC = () => {
  const { goBack, goForward, canGoBack, canGoForward } = useNavigation();
  const { theme } = useTheme();
  const location = useLocation();

  // Don't show navigation buttons on login page
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      <button
        onClick={goBack}
        disabled={!canGoBack}
        className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
          canGoBack
            ? theme === 'dark'
              ? 'bg-violet-600 hover:bg-violet-700 text-white'
              : 'bg-violet-500 hover:bg-violet-600 text-white'
            : theme === 'dark'
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        title="Go Back"
        aria-label="Go Back"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={goForward}
        disabled={!canGoForward}
        className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
          canGoForward
            ? theme === 'dark'
              ? 'bg-violet-600 hover:bg-violet-700 text-white'
              : 'bg-violet-500 hover:bg-violet-600 text-white'
            : theme === 'dark'
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        title="Go Forward"
        aria-label="Go Forward"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default GlobalNavigationButtons;