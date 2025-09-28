import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence} from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: number | string;
    label: string;
}

interface ModernDropdownProps {
    options: Option[];
    selectedValue: number | string;
    onValueSelect: (value: number | string) => void;
}

const ModernDropdown = ({ options, selectedValue, onValueSelect }: ModernDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.value === selectedValue);

    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const dropdownRect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - dropdownRect.bottom;
            // Adjusted the threshold to make it less likely to drop up
            setDropUp(spaceBelow < 220); // Previous value was 200
        }
    }, [isOpen]);


    const listVariants = {
        hidden: {
            opacity: 0,
            scaleY: 0,
        },
        visible: {
            opacity: 1,
            scaleY: 1,
            transition: {
                duration: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    return (
        <div className="modern-dropdown" ref={dropdownRef}>
            <motion.button
                type='button'
                className="dropdown-button"
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.98 }}
            >
                <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown size={18} />
                </motion.div>
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        className={`dropdown-list ${dropUp ? 'drop-up' : ''}`}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={listVariants}
                        style={{ originY: dropUp ? 1 : 0 }}
                    >
                        {Array.isArray(options) && options.map(option => (
                            <motion.li
                                key={option.value}
                                onClick={() => {
                                    onValueSelect(option.value);
                                    setIsOpen(false);
                                }}
                                variants={itemVariants}
                                whileHover={{
                                    backgroundColor: 'var(--secondary)',
                                    color: 'var(--primary)',
                                }}
                            >
                                {option.label}
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModernDropdown;