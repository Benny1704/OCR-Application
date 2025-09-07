import React from 'react';
import type { ProductDetailPopupProps } from '../../interfaces/Types';
import DataTable from './DataTable';
import { useTheme } from '../../hooks/useTheme';
import Loader from './Loader';

const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => {
    const { theme } = useTheme();
    return (
        <div className={`flex items-center gap-3 border-b pb-4 mb-6 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
            <div className={`flex-shrink-0 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{icon}</div>
            <h3 className={`text-xl font-semibold tracking-wide ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{title}</h3>
        </div>
    );
};

const ProductDetailPopup = ({ isOpen, onClose, data, isLoading }: ProductDetailPopupProps) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

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
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Line Item Details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500
                        ${theme === 'dark'
                                ? 'text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 focus:ring-offset-[#1C1C2E]'
                                : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 focus:ring-offset-gray-50'}`}
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-6 sm:p-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader type="dots" />
                        </div>
                    ) : (
                        <section>
                            <SectionHeader icon={<ItemsIcon />} title="Item Breakdown" />
                            <div className={`rounded-lg p-4 overflow-hidden ring-1 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/5'}`}>
                                <DataTable
                                    tableData={data || []}
                                    isEditable={true}
                                    isSearchable={true}
                                    pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25, 50, 100] }}
                                    maxHeight="100%"
                                />
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

const iconProps = { className: "h-7 w-7", strokeWidth: 1.5 };
const ItemsIcon = () => <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;

export default ProductDetailPopup;