import { createContext, useState, type ReactNode } from 'react';
import type { Toast as ToastType } from '../interfaces/Types';

export interface ToastContextType {
    toasts: ToastType[];
    addToast: (toast: Omit<ToastType, 'id'>) => void;
    removeToast: (id: number) => void;
    uploadFiles: File[] | null;
    showUploadStatus: (files: File[]) => void;
    hideUploadStatus: () => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastType[]>([]);
    const [uploadFiles, setUploadFiles] = useState<File[] | null>(null);

    const addToast = (toast: Omit<ToastType, 'id'>) => {
        setToasts(prev => [...prev, { ...toast, id: Date.now() }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const showUploadStatus = (files: File[]) => {
        setUploadFiles(files);
    };

    const hideUploadStatus = () => {
        setUploadFiles(null);
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, uploadFiles, showUploadStatus, hideUploadStatus }}>
            {children}
        </ToastContext.Provider>
    );
};