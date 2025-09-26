import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Section } from '../../interfaces/Types';

interface ModernDropdownProps {
    sections: Section[];
    selectedSection: number;
    onSectionSelect: (sectionId: number) => void;
}

const ModernDropdown = ({ sections, selectedSection, onSectionSelect }: ModernDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedSectionName = sections.find(s => s.section_id === selectedSection)?.section_name;

    // Enhanced variants for grow and stagger effects
    const listVariants = {
        hidden: { 
            opacity: 0,
            scaleY: 0,
            transition: { 
                when: "afterChildren",
                staggerChildren: 0.05,
                staggerDirection: -1,
            }
        },
        visible: { 
            opacity: 1, 
            scaleY: 1,
            transition: { 
                when: "beforeChildren",
                staggerChildren: 0.08,
                duration: 0.2
            } 
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 }
    };

    return (
        <div className="modern-dropdown" onMouseLeave={() => setIsOpen(false)}>
            <motion.button
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
                        className="dropdown-list"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={listVariants}
                        style={{ originY: 1 }} // Ensures the grow animation starts from the top
                    >
                        {sections.map(section => (
                            <motion.li
                                key={section.section_id}
                                onClick={() => {
                                    onSectionSelect(section.section_id);
                                    setIsOpen(false);
                                }}
                                variants={itemVariants}
                                // Replaced the weird "x" movement with a clean background change
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