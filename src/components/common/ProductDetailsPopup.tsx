import { useState, useEffect } from 'react';
import type { LineItem, DataItem, ProductDetails } from '../../interfaces/Types';
import DataTable from './DataTable';
import { useTheme } from '../../hooks/useTheme';
import Loader from './Loader';
import { Save, AlertTriangle, Eye } from 'lucide-react';
import { isEqual } from 'lodash';
import { ConfirmationModal } from './Helper';
import { updateLineItems, getLineItems } from '../../lib/api/Api';
import { useToast } from '../../hooks/useToast';

interface ProductDetailPopupProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductDetails | null;
    onSave: (isDirty: boolean) => void;
    onViewImage: () => void;
    itemAttributesConfig: any;
    invoiceId: number;
}

const ProductDetailPopup = ({ isOpen, onClose, product, onSave, onViewImage, itemAttributesConfig, invoiceId }: ProductDetailPopupProps) => {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [initialLineItems, setInitialLineItems] = useState<LineItem[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchLineItems = async () => {
            if (product?.item_id && invoiceId) {
                setIsLoading(true);
                try {
                    const fetchedLineItems = await getLineItems(invoiceId, product.item_id, addToast);
                    const newInitialLineItems = fetchedLineItems.map((item: any) => ({ ...item }));
                    setLineItems(newInitialLineItems);
                    setInitialLineItems(newInitialLineItems);
                    setIsDirty(false);
                } catch (error) {
                    addToast({ type: 'error', message: 'Failed to fetch line items.' });
                } finally {
                    setIsLoading(false);
                }
            } else {
                setLineItems([]);
                setInitialLineItems([]);
                setIsDirty(false);
            }
        };

        if (isOpen) {
            fetchLineItems();
        }
    }, [product, isOpen, invoiceId, addToast]);

    useEffect(() => {
        setIsDirty(!isEqual(initialLineItems, lineItems));
    }, [lineItems, initialLineItems]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!product?.item_id) {
            addToast({ type: 'error', message: 'Cannot save: Missing product item ID.' });
            return;
        }
        const savedLineItems = await updateLineItems(product.item_id, lineItems, addToast);
        if (savedLineItems) {
            onSave(isDirty);
            onClose();
        }
    };

    const handleClose = () => {
        if (isDirty) {
            setConfirmModalOpen(true);
        } else {
            onClose();
        }
    };

    const confirmClose = () => {
        setConfirmModalOpen(false);
        onClose();
    };

    const handleDataChange = (data: DataItem[]) => {
        setLineItems(data as LineItem[]);
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-xl z-100 flex justify-center items-center p-4 transition-opacity duration-300"
                onClick={handleClose}
            >
                <div
                    className={`w-full h-full max-h-[95vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ring-1
                        ${theme === "dark" ? "bg-[#1C1C2E] text-gray-200 ring-white/10" : "bg-gray-50 text-gray-900 ring-black/5"}
                        transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                    onClick={e => e.stopPropagation()}
                >
                    <header className={`flex-shrink-0 flex justify-between items-center p-6 sm:p-8 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                        <div>
                            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                Line Item Details for {product?.item_description}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={onViewImage} className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/15 text-gray-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} font-medium py-2 px-4 rounded-lg transition-colors`}>
                                <Eye size={16} /> View Image
                            </button>
                            <button
                                onClick={handleClose}
                                className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500
                                ${theme === 'dark' ? 'text-slate-400 hover:text-white bg-white/10 hover:bg-white/20' : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'}`}
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </header>

                    <main className="flex-grow overflow-y-auto p-6 sm:p-8">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full"><Loader type="dots" /></div>
                        ) : (
                            <div className={`rounded-lg p-4 overflow-hidden ring-1 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/5'}`}>
                                <DataTable
                                    tableData={lineItems}
                                    tableConfig={itemAttributesConfig}
                                    isEditable={true}
                                    isSearchable={true}
                                    pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25] }}
                                    maxHeight="100%"
                                    onDataChange={handleDataChange}
                                />
                            </div>
                        )}
                    </main>

                    <footer className={`flex-shrink-0 flex justify-end items-center p-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                        <button onClick={handleSave} className="flex items-center gap-2 bg-violet-600 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-violet-700">
                            <Save size={16} /> Save Changes
                        </button>
                    </footer>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmClose}
                title="Unsaved Changes"
                message="You have unsaved changes. Are you sure you want to close?"
                icon={<AlertTriangle className="text-yellow-500" size={24} />}
            />
        </>
    );
};

export default ProductDetailPopup;