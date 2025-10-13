import { useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

/**
 * Custom hook that provides navigation utilities with history tracking
 * Use this instead of useNavigate from react-router-dom for better state preservation
 */
export const useAppNavigation = () => {
  const { navigateWithHistory, goBack, goForward, canGoBack, canGoForward } = useNavigation();

  const navigate = useCallback(
    (to: string, options?: { state?: any; replace?: boolean }) => {
      navigateWithHistory(to, options);
    },
    [navigateWithHistory]
  );

  return {
    navigate,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  };
};