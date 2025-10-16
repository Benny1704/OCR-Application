import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useNavigation } from '../../contexts/NavigationContext';
import { useTheme } from '../../hooks/useTheme';

/**
 * A dedicated back button component for consistent header placement.
 * It uses the application's history (goBack, canGoBack) and theme.
 */
const BackButton: React.FC = () => {
  // Only import and use the backward navigation utilities
  const { goBack, canGoBack } = useNavigation();
  const { theme } = useTheme();
  const location = useLocation();

  // Do not show the back button on the login page, as before
  if (location.pathname === '/login') {
    return null;
  }

  // Styles are adapted for a standard header-embedded circular button.
  // The p-2 and rounded-full classes make it a small, neat button.
  return (
    <button
      onClick={goBack}
      disabled={!canGoBack}
      className={`
        p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          canGoBack
            ? theme === 'dark'
              ? 'bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-500'
              : 'bg-violet-500 hover:bg-violet-600 text-white focus:ring-violet-600'
            : theme === 'dark'
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }
      `}
      title="Go Back"
      aria-label="Go Back"
    >
      <ChevronLeft size={20} />
    </button>
  );
};

export default BackButton;