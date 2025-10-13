import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationState {
  pathname: string;
  state: any;
  search: string;
  timestamp: number;
}

interface NavigationContextType {
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  navigateWithHistory: (to: string, options?: { state?: any; replace?: boolean }) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use refs to track history without causing re-renders
  const historyStack = useRef<NavigationState[]>([]);
  const currentIndexRef = useRef(-1);
  const isNavigatingRef = useRef(false);
  const initializationRef = useRef(false);
  
  // State for UI updates
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Update UI state
  const updateNavigationState = useCallback(() => {
    setCanGoBack(currentIndexRef.current > 0);
    setCanGoForward(currentIndexRef.current < historyStack.current.length - 1);
  }, []);

  // Initialize with current location
  useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = true;
      const initialState: NavigationState = {
        pathname: location.pathname,
        state: location.state,
        search: location.search,
        timestamp: Date.now(),
      };
      historyStack.current = [initialState];
      currentIndexRef.current = 0;
      updateNavigationState();
    }
  }, []);

  // Track location changes
  useEffect(() => {
    if (!initializationRef.current) return;
    
    // If we're navigating programmatically, skip this
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      updateNavigationState();
      return;
    }

    const newState: NavigationState = {
      pathname: location.pathname,
      state: location.state,
      search: location.search,
      timestamp: Date.now(),
    };

    // Check if this is the same as current position
    const currentState = historyStack.current[currentIndexRef.current];
    if (
      currentState &&
      currentState.pathname === newState.pathname &&
      currentState.search === newState.search &&
      JSON.stringify(currentState.state) === JSON.stringify(newState.state)
    ) {
      return; // Don't add duplicate
    }

    // Remove forward history if we're navigating from middle
    if (currentIndexRef.current < historyStack.current.length - 1) {
      historyStack.current = historyStack.current.slice(0, currentIndexRef.current + 1);
    }

    // Add new state
    historyStack.current.push(newState);
    currentIndexRef.current = historyStack.current.length - 1;
    
    updateNavigationState();
    
    console.log('Navigation stack updated:', {
      total: historyStack.current.length,
      current: currentIndexRef.current,
      canGoBack: currentIndexRef.current > 0,
      canGoForward: currentIndexRef.current < historyStack.current.length - 1
    });
  }, [location.pathname, location.search, location.state, updateNavigationState]);

  const goBack = useCallback(() => {
    if (currentIndexRef.current > 0) {
      isNavigatingRef.current = true;
      currentIndexRef.current -= 1;
      const previousState = historyStack.current[currentIndexRef.current];
      
      console.log('Going back to:', previousState);
      
      navigate(previousState.pathname + previousState.search, {
        state: previousState.state,
        replace: true,
      });
      
      updateNavigationState();
    }
  }, [navigate, updateNavigationState]);

  const goForward = useCallback(() => {
    if (currentIndexRef.current < historyStack.current.length - 1) {
      isNavigatingRef.current = true;
      currentIndexRef.current += 1;
      const nextState = historyStack.current[currentIndexRef.current];
      
      console.log('Going forward to:', nextState);
      
      navigate(nextState.pathname + nextState.search, {
        state: nextState.state,
        replace: true,
      });
      
      updateNavigationState();
    }
  }, [navigate, updateNavigationState]);

  const navigateWithHistory = useCallback((to: string, options?: { state?: any; replace?: boolean }) => {
    if (options?.replace) {
      // If replacing, update current history entry
      const newState: NavigationState = {
        pathname: to.split('?')[0],
        state: options.state,
        search: to.includes('?') ? '?' + to.split('?')[1] : '',
        timestamp: Date.now(),
      };
      historyStack.current[currentIndexRef.current] = newState;
    }
    navigate(to, options);
  }, [navigate]);

  return (
    <NavigationContext.Provider
      value={{
        goBack,
        goForward,
        canGoBack,
        canGoForward,
        navigateWithHistory,
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