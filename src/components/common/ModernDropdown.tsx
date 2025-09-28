import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence} from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Section } from '../../interfaces/Types';

interface ModernDropdownProps {
    sections: Section[];
    selectedSection: number;
    onSectionSelect: (sectionId: number) => void;
}

const ModernDropdown = ({ sections, selectedSection, onSectionSelect }: ModernDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedSectionName = sections.find(s => s.section_id === selectedSection)?.section_name;

    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const dropdownRect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - dropdownRect.bottom;
            // Assuming the dropdown height to be around 200, can be adjusted
            setDropUp(spaceBelow < 200);
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
                <span>{selectedSectionName}</span>
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
                        {Array.isArray(sections) && sections.map(section => (
                            <motion.li
                                key={section.section_id}
                                onClick={() => {
                                    onSectionSelect(section.section_id);
                                    setIsOpen(false);
                                }}
                                variants={itemVariants}
                                whileHover={{
                                    backgroundColor: 'var(--secondary)',
                                    color: 'var(--primary)',
                                }}
                            >
                                {section.section_name}
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModernDropdown;