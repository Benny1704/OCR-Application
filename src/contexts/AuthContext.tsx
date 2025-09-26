import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../lib/api/Api';
import type { AuthUser, Role } from '../interfaces/Types';
import { useToast } from '../hooks/useToast';

// Helper to decode JWT tokens
const decodeToken = (token: string): { usr: string, role: Role, section: number } | null => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode token", e);
        return null;
    }
};

// Ensure the type is exported
export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string; section_id: number }) => Promise<AuthUser | null>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  switchSection: (section_id: number) => Promise<AuthUser | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        const decoded = decodeToken(token);
        if (decoded) {
            setUser({ username: decoded.usr, role: decoded.role, section: decoded.section });
        } else {
            // If token is invalid or expired, remove it
            localStorage.removeItem('token');
        }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string; section_id: number }) => {
    try {
      const data = await apiLogin(credentials, addToast);
      
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        const decoded = decodeToken(data.access_token);

        if (decoded) {
            const authenticatedUser: AuthUser = { 
                username: decoded.usr, 
                role: decoded.role, 
                section: decoded.section,
                password: credentials.password 
            };
            setUser(authenticatedUser);
            return authenticatedUser;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const hasRole = (role: Role) => {
    return user?.role === role;
  };

  const switchSection = async (section_id: number) => {
    if (!user || !user.password) {
        addToast({ message: "Unable to switch section. Please log in again.", type: "error" });
        logout();
        return null;
    }
    try {
        const data = await apiLogin({ username: user.username, password: user.password, section_id }, addToast);
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            const decoded = decodeToken(data.access_token);
            if (decoded) {
                const updatedUser: AuthUser = {
                    ...user,
                    section: decoded.section,
                };
                setUser(updatedUser);
                addToast({ message: "Successfully switched section!", type: "success" });
                window.location.reload(); // Reload the page
                return updatedUser;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
  };

  const value = { user, isLoading, login, logout, hasRole, switchSection };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};