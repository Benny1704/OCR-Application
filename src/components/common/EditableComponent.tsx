import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, Eye, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import type { ExtractedData, ProductWithDetails, DataItem } from '../../interfaces/Types';
import DataTable from './DataTable';
import { DynamicField } from './DynamicField';
import { RetryModal } from './Helper';
import ProductDetailPopup from './ProductDetailsPopup';
import { formConfig } from '../../lib/config/Config';

const initialEmptyData: ExtractedData = {
    invoice_image_url: '',
    supplier_code: '',
    supplier_name_email: '',
    by_no: '',
    gstin_no: '',
    invoice_no: '',
    grn_no: '',
    po_no: '',
    invoice_date: '',
    pattial_amount: '',
    merchandise_name: '',
    product_details: [],
    total_pcs: '',
    freight_charges: '',
    master_discount_percent: '',
    igst: '',
    igst_rounded_off: '',
    product_total: '',
    misc_additions: '',
    special_discount_percent: '',
    tcs_percent: '',
    tcs_amount: '',
    discount: '',
    misc_deductions: '',
    credit_days: '',
    tcs_rounded_off: '',
    rounded_off: '',
    taxable_value: '',
    e_invoice: '',
    total_amount: '',
};

type EditableComponentProps = {
    isManual?: boolean;
    initialData?: ExtractedData;
    isReadOnly?: boolean;
};

const EditableComponent = ({ isManual = false, initialData, isReadOnly = false }: EditableComponentProps) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [data, setData] = useState<ExtractedData>(
        isManual ? initialEmptyData : initialData || initialEmptyData
    );

    const [isRetryModalOpen, setRetryModalOpen] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
    const [openAccordion, setOpenAccordion] = useState<string | null>(formConfig[0]?.id || null);

    useEffect(() => {
        if (isManual) {
            setData(initialEmptyData);
        } else if (initialData) {
            setData(initialData);
        }
    }, [initialData, isManual]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    };

    const handleViewImage = () => {
        if (data.invoice_image_url) {
            window.open(data.invoice_image_url, '_blank', 'noopener,noreferrer');
        }
    };
    const openRetryModal = () => setRetryModalOpen(true);
    const handleSimpleRetry = () => { setRetryModalOpen(false); navigate('/loading'); };
    const handleRetryWithAlterations = () => { setRetryModalOpen(false); navigate('/imageAlteration'); };

    const finalIsReadOnly = isReadOnly || user?.role !== 'admin';

    const secondaryButtonClasses = `
    flex items-center gap-1.5 font-semibold py-1.5 px-3 text-xs md:text-sm rounded-lg transition-colors
    border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500
    ${theme === 'dark'
            ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 ring-offset-[#1C1C2E]'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 ring-offset-gray-50'
        }`;

    const renderActionCell = (row: DataItem) => {
        const productRow = row as ProductWithDetails;

        const handleOpenPopup = () => {
            // const fullProductData:any = mockProductData.find(p => p.id === productRow.id);
            // setSelectedProduct(fullProductData);
            setIsPopupOpen(true);
        };

        return (
            <button
                onClick={() => handleOpenPopup()}
                className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                title="View Details"
            >
                <Eye size={16} />
            </button>
        );
    };

    const accordionVariants: Variants = {
        open: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeInOut' } },
        collapsed: { opacity: 0, height: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
    };

    return (
        <div className={`h-full flex flex-col rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C2E] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
            <main className="flex-grow py-4 md:py-6 overflow-y-auto">
                <div className="px-4 sm:px-6 space-y-6 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-gray-50' : 'text-gray-900'}`}>
                                {isManual ? "Manual Entry" : (finalIsReadOnly ? "Review Document" : "Verify & Edit Extracted Data")}
                            </h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={handleViewImage} className={secondaryButtonClasses} disabled={!data.invoice_image_url}>
                                <Eye className="w-4 h-4" /> View Image
                            </button>
                            {!finalIsReadOnly && user?.role === 'admin' && (
                                <button onClick={openRetryModal} className={secondaryButtonClasses}>
                                    <RefreshCw className="w-4 h-4" /> Retry
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {formConfig.map((section) => {
                            const isOpen = openAccordion === section.id;
                            return (
                                <div key={section.id} className={`rounded-xl border shadow-sm transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                                    <button
                                        className="w-full flex justify-between items-center p-4 md:p-5 text-left"
                                        onClick={() => setOpenAccordion(isOpen ? null : section.id)}
                                    >
                                        <h2 className={`text-lg md:text-xl font-semibold ${theme === 'dark' ? 'text-gray-50' : 'text-gray-900'}`}>{section.title}</h2>
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.section
                                                key="content"
                                                initial="collapsed" animate="open" exit="collapsed"
                                                variants={accordionVariants}
                                                className="overflow-hidden"
                                            >
                                                <div className={`px-4 md:px-6 pb-6 border-t pt-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                                    {section.id === 'product_details' ? (
                                                        <DataTable
                                                            tableData={data.product_details}
                                                            isEditable={!finalIsReadOnly}
                                                            isSearchable={true}
                                                            renderActionCell={renderActionCell}
                                                            actionColumnHeader="Details"
                                                            pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25] }}
                                                            maxHeight="100%"
                                                        />
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                            {section.fields?.map((field: any) => (
                                                                <DynamicField
                                                                    key={field.key}
                                                                    label={field.label}
                                                                    name={field.key}
                                                                    value={data[field.key as keyof ExtractedData] as string}
                                                                    onChange={handleInputChange}
                                                                    readOnly={finalIsReadOnly}
                                                                    theme={theme}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.section>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </main>

            {!finalIsReadOnly && (
              <footer className={`flex-shrink-0 py-3 border-t backdrop-blur-sm ${theme === 'dark' ? 'bg-[#1C1C2E]/80 border-slate-700' : 'bg-gray-50/80 border-slate-200'}`}>
                  <div className="px-4 sm:px-6 flex justify-end">
                      <button
                          onClick={() => navigate('/preview')}
                          className={`flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-2 px-5 text-sm md:text-base rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 ${theme === 'dark' ? 'focus:ring-purple-800' : ''}`}
                      >
                          <Save className="w-4 h-4" /> Save and Preview
                      </button>
                  </div>
              </footer>
            )}

            <RetryModal
                isOpen={isRetryModalOpen}
                onClose={() => setRetryModalOpen(false)}
                onRetry={handleSimpleRetry}
                onRetryWithAlterations={handleRetryWithAlterations}
            />
            <ProductDetailPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                data={selectedProduct}
            />
        </div>
    );
};

export default EditableComponent;