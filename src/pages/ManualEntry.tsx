import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ChevronDown, CheckCircle, ArrowRight, Save } from 'lucide-react';
import { cloneDeep, set } from 'lodash';

// Component & Hook Imports
import DataTable from '../components/common/DataTable';
import ProductDetailPopup from '../components/common/ProductDetailsPopup';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';
import { DynamicField } from '../components/common/DynamicField';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';

// API & Type Imports
import { 
    getInvoiceConfig, 
    getInvoiceMetaConfig, 
    getItemSummaryConfig, 
    getItemAttributesConfig,
    manualInvoiceEntryInvoice,
    manualInvoiceEntryInvoiceMeta,
    manualInvoiceEntryItemSummary
} from '../lib/api/Api';
import type { FormSection, FormField, ProductDetails, InvoiceDetails, AmountAndTaxDetails, DataItem, LineItem } from '../interfaces/Types';

// --- Helper: Initial Empty State Definitions ---
const initialEmptyInvoiceDetails: InvoiceDetails = {
    supplier_id: 0, invoice_id: 0, invoice_number: '', irn: '', invoice_date: null,
    way_bill: '', acknowledgement_number: '', acknowledgement_date: null, created_at: null,
    order_number: null, order_date: null, supplier_name: '', supplier_address: '',
    supplier_gst: '', supplier_code: '', section_id: 1 // Default section_id
};

const initialEmptyAmountAndTaxDetails: AmountAndTaxDetails = {
    invoice_id: 0, meta_id: 0, invoice_amount: 0, taxable_value: 0, cgst_amount: 0,
    sgst_amount: 0, igst_amount: 0, igst_percentage: null, total_tax_amount: 0,
    other_deductions: 0, freight_charges: 0, other_charges: 0, round_off_amount: 0,
    misc_additions: 0, misc_deductions: 0, discount_id: 0, discount_percentage: 0,
    discount_amount: 0, discount_round_off: 0,
};

// --- Main Manual Entry Page Component ---
const ManualEntry = () => {
    // --- State Management ---
    const [step, setStep] = useState<'supplier' | 'details'>('supplier');
    const [configs, setConfigs] = useState<{
        form: FormSection[] | null;
        summary: { columns: FormField[] } | null;
        attributes: { columns: FormField[] } | null;
    }>({ form: null, summary: null, attributes: null });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Data State
    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>(initialEmptyInvoiceDetails);
    const [productDetails, setProductDetails] = useState<ProductDetails[]>([]);
    const [amountDetails, setAmountDetails] = useState<AmountAndTaxDetails>(initialEmptyAmountAndTaxDetails);

    // UI State
    const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['product_details']));
    
    // --- Hooks ---
    const { addToast } = useToast();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // --- Data Fetching ---
    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [
                invoiceConfigData,
                invoiceMetaConfigData,
                itemSummaryConfigData,
                itemAttributesConfigData,
            ] = await Promise.all([
                getInvoiceConfig(addToast),
                getInvoiceMetaConfig(addToast),
                getItemSummaryConfig(addToast),
                getItemAttributesConfig(addToast),
            ]);

            const fetchedFormConfig: FormSection[] = [
                { id: 'supplier_invoice', title: 'Supplier & Invoice Details', fields: invoiceConfigData.fields },
                { id: 'product_details', title: 'Product Details' },
                { id: 'amount_details', title: 'Amount & Tax Details', fields: invoiceMetaConfigData.fields },
            ];
            
            setConfigs({
                form: fetchedFormConfig,
                summary: { columns: itemSummaryConfigData.fields },
                attributes: { columns: itemAttributesConfigData.fields },
            });

        } catch (err: any) {
            setError(err.message || "An unknown error occurred while fetching configuration.");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // --- Event Handlers ---

    const handleSupplierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await manualInvoiceEntryInvoice(location.state?.messageId,invoiceDetails, addToast);
            if (response && response.invoice_id) {
                const newInvoiceId = response.invoice_id;
                setInvoiceDetails(prev => ({ ...prev, invoice_id: newInvoiceId }));
                setAmountDetails(prev => ({ ...prev, invoice_id: newInvoiceId }));
                setStep('details');
                addToast({ type: 'success', message: 'Supplier details saved successfully.' });
            }
        } catch (apiError) {
            // Error toast is already handled by the apiRequest utility
            console.error(apiError);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleSaveProductRow = async (productRow: ProductDetails): Promise<void> => {
        try {
            const response = await manualInvoiceEntryItemSummary([productRow], invoiceDetails.invoice_id, addToast);
            if (response && response.data && response.data.length > 0) {
                const savedProduct = response.data[0];
                setProductDetails(currentProducts =>
                    currentProducts.map(p => p.id === productRow.id ? { ...savedProduct, id: p.id } : p)
                );
                addToast({ type: 'success', message: response.message || 'Product row saved.' });
            }
        } catch (apiError) {
            console.error("Failed to save product row:", apiError);
        }
    };

    const handleFinalSave = async () => {
        setIsSubmitting(true);
        try {
            // 1. Save Amount Details
            await manualInvoiceEntryInvoiceMeta(amountDetails, addToast);

            // 2. Save any unsaved product rows
            const unsavedProducts = productDetails.filter(p => !p.item_id);
            if (unsavedProducts.length > 0) {
                await manualInvoiceEntryItemSummary(unsavedProducts, invoiceDetails.invoice_id, addToast);
            }
            
            addToast({ type: 'success', message: 'Invoice created successfully!' });
            navigate('/documents');
        } catch (apiError) {
            console.error("Failed to create invoice:", apiError);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, section: 'invoice' | 'amount') => {
        const { name, value } = e.target;
        const updater = section === 'invoice' ? setInvoiceDetails : setAmountDetails;
        updater((prevState: any) => set(cloneDeep(prevState), name, value));
    };

    const handleOpenPopup = (product: ProductDetails) => {
        if (!product.item_id) {
            addToast({ type: 'warning', message: 'Please save the row before viewing details.' });
            return;
        }
        setSelectedProduct(product);
        setIsPopupOpen(true);
    };
    
    const toggleAccordion = (id: string) => {
        setOpenAccordions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // --- Render Logic ---
    if (isLoading) return <Loader type="wifi" />;
    if (error) return <div className="p-4"><ErrorDisplay message={error} onRetry={fetchConfig} /></div>;
    if (!configs.form || !configs.summary || !configs.attributes) {
        return <div className="p-4"><ErrorDisplay message="Could not display the manual entry form." onRetry={fetchConfig} /></div>;
    }

    const supplierSection = configs.form.find(s => s.id === 'supplier_invoice')!;
    const productSection = configs.form.find(s => s.id === 'product_details')!;
    const amountSection = configs.form.find(s => s.id === 'amount_details')!;

    const renderActionCell = (row: DataItem) => {
        const productRow = row as ProductDetails;
        const isSaved = !!productRow.item_id;

        return isSaved ? (
            <button
                onClick={() => handleOpenPopup(productRow)}
                className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                title="View Details"
            >
                <CheckCircle size={16} />
            </button>
        ) : (
            <button
                onClick={() => handleSaveProductRow(productRow)}
                className="p-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                title="Save Row"
            >
                <Save size={16} />
            </button>
        );
    };
    
    const accordionVariants: Variants = {
        open: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeInOut' } },
        collapsed: { opacity: 0, height: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
    };

    return (
        <div className={`h-full flex flex-col rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C2E] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
            <header className={`sticky top-0 z-20 px-6 py-4 border-b backdrop-blur-md ${theme === 'dark' ? 'bg-[#1C1C2E]/80 border-slate-700' : 'bg-gray-50/80 border-slate-200'}`}>
                <h1 className={`text-xl md:text-2xl font-bold leading-tight ${theme === 'dark' ? 'text-gray-50' : 'text-gray-900'}`}>
                    Manual Invoice Entry
                </h1>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {step === 'supplier' ? 'Step 1: Enter supplier and invoice details to begin.' : 'Step 2: Add products and finalize amount details.'}
                </p>
            </header>

            <main className="flex-grow py-6 md:py-8 overflow-y-auto">
                <div className="px-6 space-y-6">
                    {/* --- Step 1: Supplier Form --- */}
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: step === 'supplier' ? 1 : 0.6, pointerEvents: step === 'supplier' ? 'auto' : 'none' }}
                        transition={{ duration: 0.4 }}
                        className={`rounded-xl border shadow-sm transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}
                    >
                        <div className="w-full flex justify-between items-center px-5 py-4 text-left">
                            <h2 className={`text-lg md:text-xl font-semibold ${theme === 'dark' ? 'text-gray-50' : 'text-gray-900'}`}>{supplierSection.title}</h2>
                            {step === 'details' && <CheckCircle className="w-6 h-6 text-emerald-500" />}
                        </div>
                        <AnimatePresence>
                        {step === 'supplier' && (
                             <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: 'easeInOut' }}
                            >
                                <form onSubmit={handleSupplierSubmit} className={`px-6 pb-6 border-t pt-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                        {supplierSection.fields?.map(field => (
                                            <DynamicField
                                                key={field.key}
                                                label={field.label}
                                                name={field.key}
                                                value={(invoiceDetails as any)[field.key] || ''}
                                                onChange={(e) => handleInputChange(e, 'invoice')}
                                                theme={theme}
                                            />
                                        ))}
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex items-center gap-2 font-semibold py-2 px-5 text-sm rounded-lg transition-colors bg-violet-600 text-white hover:bg-violet-700 disabled:bg-violet-400"
                                        >
                                            {isSubmitting ? <Loader type="btnLoader" /> : <ArrowRight size={16} />}
                                            {isSubmitting ? 'Saving...' : 'Save & Continue'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </motion.div>
                    
                    {/* --- Step 2: Product & Amount Details --- */}
                    <AnimatePresence>
                        {step === 'details' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="space-y-6"
                            >
                                {[productSection, amountSection].map((section) => {
                                    const isOpen = openAccordions.has(section.id);
                                    return (
                                        <div key={section.id} className={`rounded-xl border shadow-sm transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
                                            <button
                                                className="w-full flex justify-between items-center px-5 py-4 text-left"
                                                onClick={() => toggleAccordion(section.id)}
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
                                                        <div className={`px-6 pb-6 border-t pt-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                                            {section.id === 'product_details' ? (
                                                                <DataTable
                                                                    tableData={productDetails}
                                                                    tableConfig={configs.summary}
                                                                    isEditable={true}
                                                                    isSearchable={true}
                                                                    renderActionCell={renderActionCell}
                                                                    actionColumnHeader="Status"
                                                                    pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25] }}
                                                                    onDataChange={(newData) => setProductDetails(newData as ProductDetails[])}
                                                                />
                                                            ) : (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                                                    {section.fields?.map((field: any) => (
                                                                        <DynamicField
                                                                            key={field.key}
                                                                            label={field.label}
                                                                            name={field.key}
                                                                            value={(amountDetails as any)[field.key] || ''}
                                                                            onChange={(e) => handleInputChange(e, 'amount')}
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {step === 'details' && (
                <footer className={`flex-shrink-0 px-6 py-4 border-t flex justify-end items-center ${theme === 'dark' ? 'bg-[#1C1C2E]/80 border-slate-700' : 'bg-gray-50/80 border-slate-200'}`}>
                    <button
                        onClick={handleFinalSave}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 font-bold py-2.5 px-6 rounded-lg transition-colors bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400"
                    >
                        {isSubmitting ? <Loader type="btnLoader" /> : <Save size={18} />}
                        {isSubmitting ? 'Creating Invoice...' : 'Create Invoice'}
                    </button>
                </footer>
            )}
            
            <ProductDetailPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                product={selectedProduct}
                onSave={() => { /* The popup now handles its own save and state updates */ }}
                onViewImage={() => addToast({type: 'error', message: 'Image view not available in manual entry.'})}
                itemAttributesConfig={configs.attributes}
                invoiceId={invoiceDetails.invoice_id}
            />
        </div>
    );
};

export default ManualEntry;