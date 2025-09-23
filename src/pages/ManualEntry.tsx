import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ChevronDown, CheckCircle, ArrowRight, Save, Edit } from 'lucide-react';
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
    manualInvoiceEntryItemSummary,
    getProductDetails // Fetches all item summaries for an invoice
} from '../lib/api/Api';
import type { FormSection, ProductDetails, InvoiceDetails, AmountAndTaxDetails, DataItem, TableConfig } from '../interfaces/Types';

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
        summary: TableConfig | null;
        attributes: TableConfig | null;
    }>({ form: null, summary: null, attributes: null });

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInvoiceSubmitted, setIsInvoiceSubmitted] = useState(false);
    const [isAmountDetailsSaved, setIsAmountDetailsSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Data State
    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>(initialEmptyInvoiceDetails);
    const [productDetails, setProductDetails] = useState<ProductDetails[]>([]);
    const [amountDetails, setAmountDetails] = useState<AmountAndTaxDetails>(initialEmptyAmountAndTaxDetails);

    // UI State
    const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['product_details']));
    const [savingRowId, setSavingRowId] = useState<string | number | null>(null);

    // --- Hooks ---
    const { addToast } = useToast();
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

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
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const fetchProductDetails = useCallback(async (invoiceId: number) => {
        if (!invoiceId) return;
        try {
            const productsData = await getProductDetails(invoiceId, addToast);
            setProductDetails(productsData || []);
        } catch (err) {
            console.error("Failed to fetch product details", err);
            addToast({ type: 'error', message: 'Could not load product details.' });
        }
    }, []);


    // --- Event Handlers ---

    const handleSupplierSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await manualInvoiceEntryInvoice(location.state?.messageId, invoiceDetails, addToast);
            if (response && response.invoice_id) {
                const newInvoiceId = response.invoice_id;
                setInvoiceDetails(prev => ({ ...prev, invoice_id: newInvoiceId }));
                setAmountDetails(prev => ({ ...prev, invoice_id: newInvoiceId }));
                setStep('details');
                setIsInvoiceSubmitted(true);
                addToast({ type: 'success', message: 'Supplier details saved successfully.' });
            }
        } catch (apiError) {
            console.error(apiError);
        } finally {
            setIsSubmitting(false);
        }
    }, [, invoiceDetails, location.state?.messageId]);

    const handleSaveProductRow = useCallback(async (productRow: ProductDetails): Promise<void> => {
        const temporaryRowId = productRow.id; // ID of the row in the UI before it's saved
        setSavingRowId(temporaryRowId);

        try {
            const response = await manualInvoiceEntryItemSummary([productRow], invoiceDetails.invoice_id, addToast);

            // Check for a successful response with the saved data
            if (response && response.status === 'success' && response.data?.length > 0) {
                const savedProduct = response.data[0];
                addToast({ type: 'success', message: response.message || 'Product row saved.' });

                // Update the state by replacing the temporary row with the saved one from the server
                setProductDetails(currentProducts =>
                    currentProducts.map(p =>
                        p.id === temporaryRowId ? savedProduct : p
                    )
                );
            } else {
                // As a fallback, refresh the entire list if the response is unexpected
                addToast({ type: 'warning', message: 'Could not update the row in place. Refreshing list.' });
                await fetchProductDetails(invoiceDetails.invoice_id);
            }
        } catch (apiError) {
            console.error("Failed to save product row:", apiError);
            addToast({ type: 'error', message: 'An error occurred while saving the product.' });
        } finally {
            setSavingRowId(null);
        }
    }, [, invoiceDetails.invoice_id, fetchProductDetails]);


    const handleSaveAmountDetails = useCallback(async () => {
        setIsSubmitting(true);
        try {
            await manualInvoiceEntryInvoiceMeta(amountDetails, addToast);
            setIsAmountDetailsSaved(true);
            addToast({ type: 'success', message: 'Amount & Tax details saved successfully!' });
        } catch (apiError) {
            console.error("Failed to save amount details:", apiError);
        } finally {
            setIsSubmitting(false);
        }
    }, [, amountDetails]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, section: 'invoice' | 'amount') => {
        const { name, value } = e.target;
        const updater = section === 'invoice' ? setInvoiceDetails : setAmountDetails;
        updater((prevState: any) => set(cloneDeep(prevState), name, value));
    }, []);

    const handleOpenPopup = useCallback((product: ProductDetails) => {
        if (!product.item_id) {
            addToast({ type: 'warning', message: 'Please save the row before viewing details.' });
            return;
        }
        setSelectedProduct(product);
        setIsPopupOpen(true);
    }, []);

    const handleEdit = useCallback(() => {
        navigate(`/edit/${invoiceDetails.invoice_id}`);
    }, [navigate, invoiceDetails.invoice_id]);

    const toggleAccordion = useCallback((id: string) => {
        setOpenAccordions(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // --- Render Logic ---
    if (isLoading) return <Loader type="wifi" />;
    if (error) return <div className="p-4"><ErrorDisplay message={error} onRetry={fetchConfig} /></div>;
    if (!configs.form || !configs.summary || !configs.attributes) {
        return <div className="p-4"><ErrorDisplay message="Could not display the manual entry form." onRetry={fetchConfig} /></div>;
    }

    const supplierSection = configs.form.find(s => s.id === 'supplier_invoice');
    const productSection = configs.form.find(s => s.id === 'product_details');
    const amountSection = configs.form.find(s => s.id === 'amount_details');

    if (!supplierSection) {
        return <div className="p-4"><ErrorDisplay message="Supplier form configuration is missing." onRetry={fetchConfig} /></div>;
    }

    const areAllProductsSaved = productDetails.length > 0 && productDetails.every(p => !!p.item_id);
    const showEditButton = isInvoiceSubmitted && isAmountDetailsSaved && areAllProductsSaved;

    const renderActionCell = (row: DataItem) => {
        const productRow = row as ProductDetails;
        const isSaved = !!productRow.item_id;
        const isSaving = savingRowId === productRow.id;

        return (
            <button
                onClick={() => isSaved ? handleOpenPopup(productRow) : handleSaveProductRow(productRow)}
                disabled={isSaving}
                className={`p-1.5 rounded-md text-white focus:outline-none focus:ring-2 ${isSaved ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400' : 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400'} ${isSaving ? 'cursor-not-allowed' : ''}`}
                title={isSaved ? "View Details" : "Save Row"}
            >
                {isSaving ? <Loader type="btnLoader" /> : (isSaved ? <CheckCircle size={16} /> : <Save size={16} />)}
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className={`text-xl md:text-2xl font-bold leading-tight ${theme === 'dark' ? 'text-gray-50' : 'text-gray-900'}`}>
                            Manual Invoice Entry
                        </h1>
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {step === 'supplier' ? 'Step 1: Enter supplier and invoice details to begin.' : 'Step 2: Add products and finalize amount details.'}
                        </p>
                    </div>
                    {showEditButton && (
                        <button
                            onClick={handleEdit}
                            className="inline-flex items-center gap-2 font-semibold py-2 px-5 text-sm rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
                        >
                            <Edit size={16} />
                            Edit Invoice
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-grow py-6 md:py-8 overflow-y-auto">
                <div className="px-6 space-y-6">
                    {/* --- Step 1: Supplier Form --- */}
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: step === 'supplier' && !isInvoiceSubmitted ? 1 : 0.6 }}
                        transition={{ duration: 0.4 }}
                        className={`rounded-xl border shadow-sm transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}
                    >
                        <div className="w-full flex justify-between items-center px-5 py-4 text-left">
                            <h2 className={`text-lg md:text-xl font-semibold ${theme === 'dark' ? 'text-gray-50' : 'text-gray-900'}`}>{supplierSection.title}</h2>
                            {isInvoiceSubmitted && <CheckCircle className="w-6 h-6 text-emerald-500" />}
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
                                                    disabled={isInvoiceSubmitted}
                                                />
                                            ))}
                                        </div>
                                        {!isInvoiceSubmitted && (
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
                                        )}
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* --- Step 2: Product & Amount Details --- */}
                    <AnimatePresence>
                        {step === 'details' && (
                            <motion.div
                                key="details-step-content"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="space-y-6"
                            >
                                {productSection && amountSection ? (
                                    [productSection, amountSection].map((section) => {
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
                                                                        tableConfig={configs.summary!}
                                                                        isEditable={true}
                                                                        isSearchable={true}
                                                                        renderActionCell={renderActionCell}
                                                                        actionColumnHeader="Status"
                                                                        pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25] }}
                                                                        onDataChange={(newData) => setProductDetails(newData as ProductDetails[])}
                                                                    />
                                                                ) : (
                                                                    <div className="space-y-6">
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                                                            {section.fields?.map((field: any) => (
                                                                                <DynamicField
                                                                                    key={field.key}
                                                                                    label={field.label}
                                                                                    name={field.key}
                                                                                    value={(amountDetails as any)[field.key] || ''}
                                                                                    onChange={(e) => handleInputChange(e, 'amount')}
                                                                                    theme={theme}
                                                                                    disabled={isAmountDetailsSaved}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        {!isAmountDetailsSaved && (
                                                                            <div className="flex justify-end">
                                                                                <button
                                                                                    onClick={handleSaveAmountDetails}
                                                                                    disabled={isSubmitting}
                                                                                    className="inline-flex items-center gap-2 font-semibold py-2 px-5 text-sm rounded-lg transition-colors bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400"
                                                                                >
                                                                                    {isSubmitting ? <Loader type="btnLoader" /> : <Save size={16} />}
                                                                                    {isSubmitting ? 'Saving...' : 'Save Amount Details'}
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.section>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )
                                    })
                                ) : (
                                     <ErrorDisplay message="Could not load product and amount sections." onRetry={fetchConfig} />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <ProductDetailPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                product={selectedProduct}
                onSave={() => { /* The popup now handles its own save and state updates */ }}
                onViewImage={() => addToast({ type: 'error', message: 'Image view not available in manual entry.' })}
                itemAttributesConfig={configs.attributes}
                invoiceId={invoiceDetails.invoice_id}
            />
        </div>
    );
};

export default ManualEntry;