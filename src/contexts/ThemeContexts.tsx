import { createContext, useState, useEffect, type FC, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
export interface ThemeContextType { theme: Theme; toggleTheme: () => void; }

export const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }:{children: ReactNode}) => {
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        document.documentElement.style.colorScheme = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);
    const toggleTheme = () => setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};