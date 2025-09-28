// src/components/common/PillToggle.tsx
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { useState, useRef, useEffect } from 'react';

interface PillToggleProps<T extends string> {
    options: { label: string; value: T }[];
    selected: T;
    onSelect: (value: T) => void;
}

const PillToggle = <T extends string>({ options, selected, onSelect }: PillToggleProps<T>) => {
    const { theme } = useTheme();
    const [slider, setSlider] = useState({ width: 0, left: 0 });
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const selectedIndex = options.findIndex((o) => o.value === selected);
        const selectedTab = tabsRef.current[selectedIndex];
        const wrapper = wrapperRef.current;

        if (selectedTab && wrapper) {
            const { width } = selectedTab.getBoundingClientRect();
            const { left: wrapperLeft } = wrapper.getBoundingClientRect();
            const { left: tabLeft } = selectedTab.getBoundingClientRect();
            setSlider({ width, left: tabLeft - wrapperLeft });
        }
    }, [selected, options]);


    return (
        <div
            ref={wrapperRef}
            className={`relative flex items-center p-1 rounded-full border ${
                theme === 'dark' ? 'bg-gray-800/60 border-gray-700/40' : 'bg-gray-100/70 border-gray-200/60'
            }`}
        >
             {options.map((option, index) => (
                <button
                    ref={(el) => {
                        tabsRef.current[index] = el;
                    }}
                    key={option.value}
                    onClick={() => onSelect(option.value)}
                    className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-full transition-colors duration-300 ${
                        selected === option.value
                            ? 'text-white'
                            : theme === 'dark'
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    {option.label}
                </button>
            ))}
            <motion.div
                className="absolute top-1 left-0 h-[calc(100%-0.5rem)] bg-gradient-to-r from-violet-600 to-purple-600 rounded-full"
                animate={slider}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
        </div>
    );
};

export default PillToggle;