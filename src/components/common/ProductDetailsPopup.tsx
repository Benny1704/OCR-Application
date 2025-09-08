import React, { useState, useEffect } from 'react';
import type { ProductDetailPopupProps, LineItem } from '../../interfaces/Types';
import DataTable from './DataTable';
import { useTheme } from '../../hooks/useTheme';
import Loader from './Loader';
import { Save } from 'lucide-react';

const ProductDetailPopup = ({ isOpen, onClose, product, onSave, isLoading }: ProductDetailPopupProps) => {
    const { theme } = useTheme();
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    useEffect(() => {
        if (product && product.line_items) {
            setLineItems(product.line_items);
        } else {
            setLineItems([]);
        }
    }, [product]);

    if (!isOpen) return null;
    
    const handleSave = () => {
        onSave(lineItems);
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex justify-center items-center p-4 transition-opacity duration-300"
            onClick={onClose}
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
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500
                        ${theme === 'dark' ? 'text-slate-400 hover:text-white bg-white/10 hover:bg-white/20' : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'}`}
                        aria-label="Close"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-6 sm:p-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full"><Loader type="dots" /></div>
                    ) : (
                        <div className={`rounded-lg p-4 overflow-hidden ring-1 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/5'}`}>
                            <DataTable
                                tableData={lineItems}
                                isEditable={true}
                                isSearchable={true}
                                pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25] }}
                                maxHeight="100%"
                                onDataChange={setLineItems}
                            />
                        </div>
                    )}
                </main>
                
                <footer className={`flex-shrink-0 flex justify-end p-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                    <button onClick={handleSave} className="flex items-center gap-2 bg-violet-600 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-violet-700">
                        <Save size={16} /> Save Changes
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ProductDetailPopup;