import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className={`cursor-pointer w-full h-full flex items-center justify-center transition-all duration-300 ${theme === 'dark' ? 'text-gray-900 hover:bg-gray-800/50 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-violet-600'}`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
        </button>
    );
};

export default ThemeToggle
