// src/contexts/AuthContext.tsx
import { createContext, useState, type ReactNode } from 'react';
import type { AuthUser, Role } from '../interfaces/Types';
import { jwtDecode } from 'jwt-decode';
import * as api from '../lib/api/Api';

export interface AuthContextType {
    user: AuthUser | null;
    login: (credentials: { username: string, password: string }) => Promise<AuthUser | null>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken: { username: string, role: Role } = jwtDecode(token);
                return { username: decodedToken.username, role: decodedToken.role };
            } catch (error) {
                return null;
            }
        }
        return null;
    });

    const login = async (credentials: {username: string, password: string}): Promise<AuthUser | null> => {
        const data = await api.login(credentials);
        
        if (data && data.access_token) {
            localStorage.setItem('token', data.access_token);
            try {
                const decodedToken: { username: string, role: Role } = jwtDecode(data.access_token);
                const user = { username: decodedToken.username, role: decodedToken.role };
                setUser(user);
                return user;
            } catch (error) {
                return null;
            }
        }
        return null;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};