import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationState {
  pathname: string;
  search: string;
  state: any;
  timestamp: number;
}

interface NavigationContextType {
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  navigateWithHistory: (to: string, options?: { state?: any; replace?: boolean }) => void;
  updateCurrentState: (newState: any) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const historyStack = useRef<NavigationState[]>([]);
  const currentIndexRef = useRef(-1);
  const isNavigatingByUI = useRef(false);

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const updateNavigationState = useCallback(() => {
    setCanGoBack(currentIndexRef.current > 0);
    setCanGoForward(currentIndexRef.current < historyStack.current.length - 1);
  }, []);

  useEffect(() => {
    if (isNavigatingByUI.current) {
      isNavigatingByUI.current = false;
      return;
    }

    const newNavigationState: NavigationState = {
      pathname: location.pathname,
      search: location.search,
      state: location.state,
      timestamp: Date.now(),
    };

    const newHistory = historyStack.current.slice(0, currentIndexRef.current + 1);
    newHistory.push(newNavigationState);
    historyStack.current = newHistory;
    currentIndexRef.current = newHistory.length - 1;

    updateNavigationState();
  }, [location, updateNavigationState]);

  const goBack = useCallback(() => {
    if (currentIndexRef.current > 0) {
      isNavigatingByUI.current = true;
      currentIndexRef.current -= 1;
      const previousState = historyStack.current[currentIndexRef.current];
      navigate(previousState.pathname + previousState.search, {
        state: previousState.state,
        replace: true,
      });
      updateNavigationState();
    }
  }, [navigate, updateNavigationState]);

  const goForward = useCallback(() => {
    if (currentIndexRef.current < historyStack.current.length - 1) {
      isNavigatingByUI.current = true;
      currentIndexRef.current += 1;
      const nextState = historyStack.current[currentIndexRef.current];
      navigate(nextState.pathname + nextState.search, {
        state: nextState.state,
        replace: true,
      });
      updateNavigationState();
    }
  }, [navigate, updateNavigationState]);

  const navigateWithHistory = useCallback(
    (to: string, options?: { state?: any; replace?: boolean }) => {
      navigate(to, options);
    },
    [navigate]
  );

  const updateCurrentState = useCallback((newState: any) => {
    const currentState = historyStack.current[currentIndexRef.current];
    if (currentState) {
      currentState.state = { ...currentState.state, ...newState };
    }
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        goBack,
        goForward,
        canGoBack,
        canGoForward,
        navigateWithHistory,
        updateCurrentState,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};