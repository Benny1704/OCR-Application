// src/contexts/AuthContext.tsx
import { createContext, useState, type ReactNode } from 'react';
import type { AuthUser, Role } from '../interfaces/Types';
import { jwtDecode } from 'jwt-decode';
import * as api from '../lib/api/Api';

export interface AuthContextType {
    user: AuthUser | null;
    login: (credentials: { username: string, password: string }) => Promise<boolean>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const token = localStorage.getItem('token');
        console.log("token: "+ token);
        if (token) {
            try {
                const decodedToken: { username: string, role: Role } = jwtDecode(token);
                console.log(decodedToken.username + " " + decodedToken.role);
                return { username: decodedToken.username, role: decodedToken.role };
            } catch (error) {
                return null;
            }
        }
        return null;
    });

    const login = async (credentials: {username: string, password: string}): Promise<boolean> => {
        const data = await api.login(credentials);
        console.log("data "+data?.access_token);
        
        if (data && data.access_token) {
            localStorage.setItem('token', data.access_token);
            console.log("token: "+ data.access_token);
            try {
                const decodedToken: { username: string, role: Role } = jwtDecode(data.access_token);
                console.log(decodedToken.username + " " + decodedToken.role);
                setUser({ username: decodedToken.username, role: decodedToken.role });
                return true;
            } catch (error) {
                return false;
            }
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};