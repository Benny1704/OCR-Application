import { RefreshCw, X, CheckCircle, AlertTriangle, UploadCloud } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { InfoPillProps, PopupProps, Document, Toast as ToastType } from '../../interfaces/Types';
import { motion } from 'framer-motion';

export const Toast = ({ toast, onRemove }: { toast: ToastType; onRemove: (id: number) => void; }) => {
    const { theme } = useTheme();

    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [toast, onRemove]);

    const iconMap = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <AlertTriangle className="w-5 h-5 text-red-500" />,
    };

    const toastVariants = {
        initial: { opacity: 0, y: -20, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, x: 50, scale: 0.8 },
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

export const Popup = ({ isOpen, onClose, data }: PopupProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-3 text-gray-800">Item Details</h2>
        <div className="space-y-1.5 text-sm">
          {data && Object.entries(data).map(([key, value]) => (
            <p key={key} className="text-gray-600">
              <span className="font-semibold capitalize text-gray-800">{key.replace(/_/g, ' ')}: </span>
              {value.toString()}
            </p>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 text-sm">
          Close
        </button>
      </div>
    </div>
  );
};

export const InfoPill = ({ children }: InfoPillProps) => (
    <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold mr-1.5 px-2 py-0.5 rounded-full">
        {children}
    </span>
);

export const HowToUse = () => (
    <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-20">
        <h4 className="font-bold mb-1.5 text-sm">How to Use</h4>
        <ul className="list-disc list-inside space-y-1">
            <li><b>Edit:</b> Double-click cell</li>
            <li><b>Select:</b> Click, Ctrl+Click</li>
            <li><b>Shift Cells:</b> Shift+Arrows</li>
            <li><b>Shift Group:</b> Alt+Arrows</li>
        </ul>
    </div>
);


export const RetryModal = ({ isOpen, onClose, onRetry, onRetryWithAlterations }: { isOpen: boolean; onClose: () => void; onRetry: () => void; onRetryWithAlterations: () => void; }) => { if (!isOpen) return null; return ( <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}> <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}> <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center mb-2">Retry Processing</h3> <p className="text-gray-500 dark:text-gray-400 text-center mb-6 text-sm">Choose how you would like to re-process.</p> <div className="space-y-3"> <button onClick={onRetry} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-2.5 px-4 rounded-lg text-sm"> <RefreshCw className="w-4 h-4"/> Just Retry </button> <button onClick={onRetryWithAlterations} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2.5 px-4 rounded-lg text-sm"> Retry with Alterations </button> </div> </div> </div> ); };
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