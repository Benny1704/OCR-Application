import { RefreshCw, X, CheckCircle, AlertTriangle, UploadCloud, Info, ArrowLeftRight, ArrowUpDown, ChevronsUpDown, ClipboardPaste, Copy, Keyboard, MousePointer2, Redo2, Undo2, MousePointerClick, Expand, PlusSquare } from 'lucide-react';
import { useState, useEffect, Fragment, type ReactNode } from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { Document, Toast as ToastType, DataItem } from '../../interfaces/Types';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { svgVariants, toastVariants } from './Animation';

// --- Confirmation Modal ---
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    icon?: ReactNode;
}

// --- Other Helper Components ---
interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    data: DataItem | null;
}

interface NoDataDisplayProps {
    heading?: string;
    message?: string;
    children?: ReactNode;
  }

export const formatIndianCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) {
        return '';
    }
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
        return String(value);
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue).replace('₹', '₹ ');
};


export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, icon }: ConfirmationModalProps) => {
    const { theme } = useTheme();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={`relative w-full max-w-md rounded-2xl shadow-xl overflow-hidden ring-1 
                            ${theme === 'dark' ? 'bg-[#1C1C2E] text-gray-200 ring-white/10' : 'bg-white text-gray-900 ring-black/5'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                {icon && (
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-100'}`}>
                                        {icon}
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <h3 className="text-lg font-semibold">{title}</h3>
                                    <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
                                </div>
                            </div>
                        </div>
                        <div className={`px-6 py-4 flex justify-end gap-3 border-t ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-slate-200'}`}>
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const WarningConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, icon }: ConfirmationModalProps) => {
    const { theme } = useTheme();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={`relative w-full max-w-md rounded-2xl shadow-xl overflow-hidden ring-1 
                            ${theme === 'dark' ? 'bg-[#1C1C2E] text-gray-200 ring-white/10' : 'bg-white text-gray-900 ring-black/5'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                {icon && (
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-100'}`}>
                                        {icon}
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <h3 className="text-lg font-semibold">{title}</h3>
                                    <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
                                </div>
                            </div>
                        </div>
                        <div className={`px-6 py-4 flex justify-end gap-3 border-t ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-slate-200'}`}>
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            >
                                Continue Editing
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-4 py-2 text-sm font-medium bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                            >
                                Force Proceed
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


export const Toast = ({ toast, onRemove }: { toast: ToastType; onRemove: (id: number) => void; }) => {
    const { theme } = useTheme();

    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [toast, onRemove]);

    const iconMap: Record<ToastType['type'], ReactNode> = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <AlertTriangle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
    };

    return (
        <motion.div
            layout
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`w-full max-w-sm p-4 rounded-xl shadow-lg flex items-start gap-3 border backdrop-blur-lg ${
                theme === 'dark' 
                ? 'bg-gray-800/80 border-gray-700/60 text-white' 
                : 'bg-white/80 border-gray-200/80 text-gray-900'
            }`}
        >
            <div className="flex-shrink-0 mt-0.5">{iconMap[toast.type]}</div>
            <div className="flex-grow">
                <p className="font-semibold text-sm">{toast.message}</p>
                {toast.action && (
                    <button 
                        onClick={toast.action.onClick} 
                        className={`mt-2 text-sm font-bold rounded-md px-3 py-1 transition-colors ${
                            theme === 'dark' 
                            ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                            : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                        }`}
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button onClick={() => onRemove(toast.id)} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

export const UploadStatus = ({ files, onClose }: { files: File[]; onClose: () => void; }) => {
    const { theme } = useTheme();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(onClose, 500); 
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
        return () => clearInterval(interval);
    }, [onClose]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`w-full max-w-xs p-4 rounded-xl shadow-lg flex flex-col gap-3 border backdrop-blur-lg ${
            theme === 'dark' 
            ? 'bg-gray-800/80 border-gray-700/60 text-white' 
            : 'bg-white/80 border-gray-200/80 text-gray-900'
        }`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-violet-500" />
                    <p className="font-semibold text-sm">Uploading {files.length} file(s)</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-right">{progress}%</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="bg-violet-600 h-1.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
                </div>
            </div>
        </motion.div>
    );
};

// Assuming Popup and InfoPill are also in this file
export const Popup = ({ isOpen, onClose, data }: PopupProps) => {
    const { theme } = useTheme();

    return (
        <AnimatePresence>
            {isOpen && data && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className={`p-6 rounded-lg shadow-xl w-full max-w-md relative ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={onClose} className={`absolute top-3 right-3 p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                            <X size={18} />
                        </button>
                        <h3 className="text-lg font-bold mb-4">Item Details</h3>
                        <div className="space-y-2 text-sm">
                            {Object.entries(data).map(([key, value]) => (
                                <div key={key} className="flex justify-between border-b border-dashed pb-1">
                                    <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span>{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const InfoPill = ({ children }: { children: ReactNode }) => {
    const { theme } = useTheme();
    return (
        <div className={`px-3 py-1 text-xs rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
            {children}
        </div>
    );
};


// Helper component for keyboard keys
const Kbd = ({ children }: { children: ReactNode }) => {
    const { theme } = useTheme();
    return (
        <kbd className={`px-2 py-1 text-xs font-semibold font-sans transition-colors ${theme === 'dark' ? 'text-violet-300 bg-gray-900/60' : 'text-violet-700 bg-violet-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-violet-200'} rounded-md shadow-sm`}>
            {children}
        </kbd>
    );
};

// Revamped HowToUse component with staggered animations
export const HowToUse = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { theme } = useTheme();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.06,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.2,
                ease: "easeOut",
            },
        },
    };

    const shortcuts = [
         {
            category: 'Selection & Navigation',
            items: [
                { action: 'Select Cell', keys: ['Click'], icon: <MousePointerClick size={16} /> },
                { action: 'Multi-select', keys: [<Kbd>Ctrl</Kbd>, '+', 'Click'], icon: <PlusSquare size={16} /> },
                { action: 'Expand Selection', keys: [<Kbd>Ctrl</Kbd>, '+', <Kbd>Arrows</Kbd>], icon: <Expand size={16} /> },
            ]
        },
        {
            category: 'Editing & Data',
            items: [
                { action: 'Edit Cell', keys: ['Double Click'], icon: <MousePointer2 size={16} /> },
                { action: 'Copy Cell', keys: [<Kbd>Ctrl</Kbd>, '+', <Kbd>C</Kbd>], icon: <Copy size={16} /> },
                { action: 'Paste Value', keys: [<Kbd>Ctrl</Kbd>, '+', <Kbd>V</Kbd>], icon: <ClipboardPaste size={16} /> },
                { action: 'Move Cell Content', keys: [<Kbd>Shift</Kbd>, '+', <Kbd>Arrows</Kbd>], icon: <ChevronsUpDown size={16} /> },
                { action: 'Move Row', keys: [<Kbd>Alt</Kbd>, '+', <Kbd>↑</Kbd>, <Kbd>↓</Kbd>], icon: <ArrowUpDown size={16} /> },
                { action: 'Move Column', keys: [<Kbd>Alt</Kbd>, '+', <Kbd>←</Kbd>, <Kbd>→</Kbd>], icon: <ArrowLeftRight size={16} /> },
            ]
        },
        {
            category: 'History',
            items: [
                { action: 'Undo', keys: [<Kbd>Ctrl</Kbd>, '+', <Kbd>Z</Kbd>], icon: <Undo2 size={16} /> },
                { action: 'Redo', keys: [<Kbd>Ctrl</Kbd>, '+', <Kbd>Y</Kbd>], icon: <Redo2 size={16} /> },
            ]
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} // Snappy cubic-bezier transition
                        className={`w-96 rounded-xl shadow-2xl z-[100] overflow-hidden border ${theme === 'dark' ? 'bg-gray-800/80 border-gray-700/60 backdrop-blur-lg' : 'bg-white/80 border-gray-200/60 backdrop-blur-lg'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`p-4 border-b flex items-center gap-4 ${theme === 'dark' ? 'border-gray-700/60' : 'border-gray-200/60'}`}>
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-600'}`}>
                                <Keyboard size={24} />
                            </div>
                            <div>
                                <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Shortcuts Guide</h4>
                                <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Master the data grid</p>
                            </div>
                        </div>
                        <motion.div 
                            className="p-4 max-h-80 overflow-y-auto"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {shortcuts.map(section => (
                                <div key={section.category} className="mb-5 last:mb-0">
                                    <motion.h5 
                                        variants={itemVariants} 
                                        className={`font-semibold text-sm mb-3 px-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                                    >
                                        {section.category}
                                    </motion.h5>
                                    <ul className="space-y-2">
                                        {section.items.map(shortcut => (
                                            <motion.li 
                                                key={shortcut.action} 
                                                variants={itemVariants}
                                                className="flex justify-between items-center text-sm p-1 rounded-md"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>{shortcut.icon}</span>
                                                    <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>{shortcut.action}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {shortcut.keys.map((key, index) => (
                                                        <Fragment key={index}>{key}</Fragment>
                                                    ))}
                                                </div>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const NoDataDisplay = ({ heading, message, children }: NoDataDisplayProps) => {
    const { theme } = useTheme();

    // Define colors based on the theme for a cohesive look
    const primaryColor = 'rgba(139, 92, 246, 0.7)'; // A slightly transparent violet
    const secondaryColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const headingColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                className="flex flex-col items-center"
            >
                {/* A more illustrative and modern SVG representation */}
                <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Ghostly representation of a bar chart in the background */}
                    <motion.path d="M25 80 V40" stroke={secondaryColor} strokeWidth="6" strokeLinecap="round" variants={svgVariants} initial="hidden" animate="visible" custom={0.1} />
                    <motion.path d="M42 80 V60" stroke={secondaryColor} strokeWidth="6" strokeLinecap="round" variants={svgVariants} initial="hidden" animate="visible" custom={0.2} />
                    <motion.path d="M59 80 V50" stroke={secondaryColor} strokeWidth="6" strokeLinecap="round" variants={svgVariants} initial="hidden" animate="visible" custom={0.3} />
                    <motion.path d="M76 80 V70" stroke={secondaryColor} strokeWidth="6" strokeLinecap="round" variants={svgVariants} initial="hidden" animate="visible" custom={0.4} />

                    {/* A magnifying glass with a question mark, indicating a search with no results */}
                    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1.2 }}>
                        <circle cx="45" cy="45" r="15" stroke={primaryColor} strokeWidth="3" fill="transparent" />
                        <line x1="57" y1="57" x2="67" y2="67" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
                        <text x="45" y="49" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="bold" fill={primaryColor} textAnchor="middle">?</text>
                    </motion.g>
                </svg>

                <h3 className={`text-xl font-semibold mt-6 ${headingColor}`}>
                    {heading || "Nothing to display"}
                </h3>
                <p className={`text-sm mt-2 max-w-xs ${textColor}`}>
                    {message || "We couldn't find any data for your current selection. Please try different filters."}
                </p>
                {children}
            </motion.div>
        </div>
    );
};

export const RetryModal = ({ isOpen, onClose, onRetry, onRetryWithAlterations }: { isOpen: boolean; onClose: () => void; onRetry: () => void; onRetryWithAlterations: () => void; }) => { if (!isOpen) return null; return ( <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex justify-center items-center p-4" onClick={onClose}> <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}> <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center mb-2">Retry Processing</h3> <p className="text-gray-500 dark:text-gray-400 text-center mb-6 text-sm">Choose how you would like to re-process.</p> <div className="space-y-3"> <button onClick={onRetry} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-2.5 px-4 rounded-lg text-sm"> <RefreshCw className="w-4 h-4"/> Just Retry </button> <button onClick={onRetryWithAlterations} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2.5 px-4 rounded-lg text-sm"> Retry with Alterations </button> </div> </div> </div> ); };
export const StatusBadge = ({ status, large = false, theme = 'light' }: { status: Document['status'], large?: boolean, theme?: 'light' | 'dark' }) => {
    const lightStyles = {
        Queued: 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-600/20',
        Processing: 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20 animate-pulse',
        Processed: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20',
        Failed: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20',
        Reviewed: 'bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-600/20',
    };
    const darkStyles = {
        Queued: 'bg-blue-900/50 text-blue-300 ring-1 ring-inset ring-blue-400/30',
        Processing: 'bg-yellow-900/50 text-yellow-300 ring-1 ring-inset ring-yellow-400/30 animate-pulse',
        Processed: 'bg-green-900/50 text-green-300 ring-1 ring-inset ring-green-400/30',
        Failed: 'bg-red-900/50 text-red-300 ring-1 ring-inset ring-red-400/30',
        Reviewed: 'bg-purple-900/50 text-purple-300 ring-1 ring-inset ring-purple-400/30',
    };
    
    const styles = theme === 'light' ? lightStyles : darkStyles;
    const size = large ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';
    
    return <span className={`${size} rounded-full font-semibold capitalize ${styles[status]}`}>{status}</span>;
};