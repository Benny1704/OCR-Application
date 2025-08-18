import { createContext, useState, type FC, type ReactNode } from 'react';
import { type AuthUser } from '../interfaces/Types';

export interface AuthContextType { user: AuthUser | null; login: (email: string) => boolean; logout: () => void; }
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const login = (email: string): boolean => {
        if (email.toLowerCase() === 'admin@nextriq') { setUser({ email, role: 'admin' }); return true; }
        if (email.toLowerCase() === 'user@nextriq') { setUser({ email, role: 'user' }); return true; }
        return false;
    };
    const logout = () => { setUser(null); };
    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};