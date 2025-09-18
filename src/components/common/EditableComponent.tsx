import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RefreshCw, Save, Eye, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import type { InvoiceDetails, ProductDetails, AmountAndTaxDetails, DataItem, LineItem, FormSection, FormField } from '../../interfaces/Types';
import DataTable from './DataTable';
import { DynamicField } from './DynamicField';
import { RetryModal } from './Helper';
import ProductDetailPopup from './ProductDetailsPopup';
import { useToast } from '../../hooks/useToast';
import { set, get, cloneDeep, isEqual } from 'lodash';
import { getLineItems, updateLineItems, updateInvoiceDetails, updateProductDetails, updateAmountAndTaxDetails, confirmInvoice } from '../../lib/api/Api';
import { useParams } from 'react-router-dom';

const initialEmptyInvoiceDetails: InvoiceDetails = {
    invoice_id: 0, message_id: '', invoice_number: '', irn: '', invoice_date: null, way_bill: '',
    acknowledgement_number: '', acknowledgement_date: '', order_number: null, order_date: null,
    supplier_id: 0, supplier_name: '', supplier_address: '', supplier_gst: ''
};
const initialEmptyProductDetails: ProductDetails[] = [];
const initialEmptyAmountAndTaxDetails: AmountAndTaxDetails = {
    meta_id: 0, invoice_amount: 0, taxable_value: 0, cgst_amount: 0, sgst_amount: 0,
    igst_amount: 0, igst_percentage: null, total_tax_amount: 0, other_deductions: 0,
    freight_charges: 0, other_charges: 0, round_off_amount: 0,
    discount_percentage: 0,
    discount_amount: 0,
};

type EditableComponentProps = {
    isManual?: boolean;
    initialInvoiceDetails?: InvoiceDetails | null;
    initialProductDetails?: ProductDetails[] | null;
    initialAmountAndTaxDetails?: AmountAndTaxDetails | null;
    isReadOnly?: boolean;
    invoiceError?: string | null;
    productError?: string | null;
    amountError?: string | null;
    onRetry?: () => void;
    messageId: string;
    formConfig: FormSection[];
    itemSummaryConfig: { columns: FormField[] };
    itemAttributesConfig: { columns: FormField[] };
    // --- NEW PROP FOR SAVING A PRODUCT ROW ---
    onSaveNewProduct: (product: ProductDetails) => Promise<ProductDetails>;
};

const EditableComponent = ({
    isManual = false,
    initialInvoiceDetails,
    initialProductDetails,
    initialAmountAndTaxDetails,
    isReadOnly = false,
    onRetry,
    messageId,
    formConfig,
    itemSummaryConfig,
    itemAttributesConfig,
    // --- RECEIVING THE NEW PROP ---
    onSaveNewProduct
}: EditableComponentProps) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { invoiceId } = useParams<{ invoiceId: string }>();

    const [invoiceDetails, setInvoiceDetails] = useState(() =>
        isManual ? initialEmptyInvoiceDetails : cloneDeep(initialInvoiceDetails!)
    );
    const [productDetails, setProductDetails] = useState(() =>
        isManual ? initialEmptyProductDetails : cloneDeep(initialProductDetails!)
    );
    const [amountDetails, setAmountDetails] = useState(() =>
        isManual ? initialEmptyAmountAndTaxDetails : cloneDeep(initialAmountAndTaxDetails!)
    );

    const [isRetryModalOpen, setRetryModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isLineItemsLoading, setIsLineItemsLoading] = useState(false);
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(formConfig.length ? [formConfig[0].id] : []));
    const [isDirty, setIsDirty] = useState(false);
    const [isValidationOpen, setValidationOpen] = useState(false);
    const [validationInfo, setValidationInfo] = useState<{ computed: number; invoice: number } | null>(null);

    const productRows = useMemo(() => (
        Array.isArray(productDetails) ? (productDetails as any[]) : ((productDetails as any)?.items || [])
    ), [productDetails]);

    const liveCalculatedAmount = useMemo(() => (
        productRows.reduce((sum: number, row: any) => sum + (Number(row?.total_amount) || 0), 0)
    ), [productRows]);

    const liveInvoiceAmount = useMemo(() => Number((amountDetails as any)?.invoice_amount) || 0, [amountDetails]);

    useEffect(() => {
        const initialInv = isManual ? initialEmptyInvoiceDetails : initialInvoiceDetails;
        const initialProd = isManual ? initialEmptyProductDetails : initialProductDetails;
        const initialAmt = isManual ? initialEmptyAmountAndTaxDetails : initialAmountAndTaxDetails;

        const hasChanged = !isEqual(initialInv, invoiceDetails) ||
            !isEqual(initialProd, productDetails) ||
            !isEqual(initialAmt, amountDetails);
        setIsDirty(hasChanged);
    }, [invoiceDetails, productDetails, amountDetails, initialInvoiceDetails, initialProductDetails, initialAmountAndTaxDetails, isManual]);

    const combinedData = useMemo(() => ({
        ...invoiceDetails,
        ...amountDetails,
        product_details: productDetails,
    }), [invoiceDetails, productDetails, amountDetails]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isInvoiceField = Object.keys(initialEmptyInvoiceDetails).includes(name);
        const isAmountField = Object.keys(initialEmptyAmountAndTaxDetails).includes(name);

        if (isInvoiceField) {
            setInvoiceDetails(prevState => set({ ...cloneDeep(prevState) }, name, value));
        } else if (isAmountField) {
            setAmountDetails(prevState => set({ ...cloneDeep(prevState) }, name, value));
        }
    };

    const handleViewImage = () => addToast({ type: 'error', message: 'Image view functionality is not yet connected.' });
    const openRetryModal = () => setRetryModalOpen(true);
    const handleSimpleRetry = () => { setRetryModalOpen(false); if (onRetry) onRetry(); };
    const handleRetryWithAlterations = () => { setRetryModalOpen(false); navigate('/imageAlteration'); };

    const finalIsReadOnly = isReadOnly;

    const secondaryButtonClasses = `flex items-center gap-1.5 font-semibold py-2 px-4 text-sm rounded-lg transition-colors border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 ${theme === 'dark' ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 ring-offset-[#1C1C2E]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 ring-offset-gray-50'}`;

    const handleOpenPopup = async (product: ProductDetails) => {
        if (isManual || !product.item_id) {
            addToast({ type: 'error', message: 'Cannot view details for an unsaved item.' });
            return;
        }
        setSelectedProduct(product);
        setIsPopupOpen(true);
        setIsLineItemsLoading(true);
        try {
            const invoiceIdNum = parseInt(invoiceId!, 10);
            const lineItems = await getLineItems(invoiceIdNum, product.item_id, addToast);
            setSelectedProduct({ ...product, line_items: lineItems || [] });
        } catch (err: any) {
            addToast({ type: "error", message: err.message || "Failed to fetch line items." });
        } finally {
            setIsLineItemsLoading(false);
        }
    };

    const handleSaveLineItems = async (updatedLineItems: LineItem[]) => {
        if (!selectedProduct) return;
        const savedLineItems = await updateLineItems(selectedProduct.item_id, updatedLineItems, addToast);
        if (savedLineItems) {
            setProductDetails(currentProducts => {
                const newProducts = cloneDeep(currentProducts);
                const productIndex = newProducts.findIndex(p => p.id === selectedProduct.id);
                if (productIndex !== -1) {
                    newProducts[productIndex].line_items = savedLineItems;
                }
                return newProducts;
            });
        }
        setIsPopupOpen(false);
    };

    // --- NEW HANDLER FOR SAVING A ROW ---
    const handleSaveRow = useCallback(async (productRow: ProductDetails) => {
        if (onSaveNewProduct) {
            try {
                // The parent (Edit.tsx) will handle the API call and state update
                await onSaveNewProduct(productRow);
            } catch (error) {
                // Error toast is already handled in the parent's save function
                console.error("Failed to save product row from EditableComponent", error);
            }
        }
    }, [onSaveNewProduct]);
    
    // --- MODIFIED RENDER FUNCTION ---
    // This function now decides whether to show a "Save" or "View" button.
    const renderActionCell = (row: DataItem) => {
        const productRow = row as unknown as ProductDetails;
        // A new row won't have an `item_id` until it's saved.
        const isSaved = !!productRow.item_id;

        if (isSaved) {
            return (
                <button
                    onClick={() => handleOpenPopup(productRow)}
                    className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    title="View Details"
                    disabled={isManual}
                >
                    <Eye size={16} />
                </button>
            );
        } else {
            return (
                <button
                    onClick={() => handleSaveRow(productRow)}
                    className="p-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    title="Save Row"
                >
                    <Save size={16} />
                </button>
            );
        }
    };

    const accordionVariants: Variants = {
        open: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeInOut' } },
        collapsed: { opacity: 0, height: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
    };

    const getValue = (path: string) => get(combinedData, path, '');

    const toggleAccordion = (id: string) => {
        setOpenAccordions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        if (!invoiceId) return;
        const invoiceIdNum = parseInt(invoiceId, 10);
        try {
            const [savedInvoice, savedProducts, savedAmount] = await Promise.all([
                updateInvoiceDetails(invoiceIdNum, invoiceDetails, addToast),
                updateProductDetails(invoiceIdNum, productDetails.filter(p => p.item_id), addToast), // Only save products with an item_id
                updateAmountAndTaxDetails(invoiceIdNum, amountDetails, addToast),
            ]);

            if (savedInvoice) setInvoiceDetails(savedInvoice);
            if (savedProducts) setProductDetails(savedProducts);
            if (savedAmount) setAmountDetails(savedAmount);

            if (savedInvoice && savedProducts && savedAmount) {
                addToast({ type: 'success', message: 'Invoice saved successfully!' });
                navigate('/document');
            } else {
                addToast({ type: 'error', message: 'An error occurred while saving. Please try again.' });
            }
        } catch (error: any) {
            addToast({ type: 'error', message: `An error occurred while saving: ${error.message}` });
        }
    }

    const handleValidateAndSave = async () => {
        if (productDetails.some(p => !p.item_id)) {
            addToast({ type: 'warning', message: 'Please save all new product rows before saving the invoice.' });
            return;
        }
        const computed = liveCalculatedAmount;
        const invoiceAmt = liveInvoiceAmount;
        if (Math.abs(computed - invoiceAmt) >= 0.01) {
            setValidationInfo({ computed, invoice: invoiceAmt });
            setValidationOpen(true);
            return;
        }
        await handleSave();
    };

    const handleForceSave = async () => {
        setValidationOpen(false);
        await handleSave();
    }

    const handleConfirm = async () => {
        if (!messageId) {
            addToast({ type: 'error', message: 'Message ID not found.' });
            return;
        }
        const success = await confirmInvoice(messageId, addToast);
        if (success) {
            navigate('/document');
        }
    };

    // --- REMAINDER OF THE COMPONENT IS UNCHANGED ---
    return (
      <div className={`h-full flex flex-col rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C2E] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
           <header className={`sticky top-0 z-20 px-6 py-4 border-b backdrop-blur-md ${theme === 'dark' ? 'bg-[#1C1C2E]/80 border-slate-700' : 'bg-gray-50/80 border-slate-200'}`}>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div className="min-w-0">
                        <h1 className={`text-xl md:text-2xl font-bold leading-tight ${theme === 'dark' ? 'text-gray-50' : 'text-gray-900'}`}>
                            {isManual ? "Manual Entry" : (finalIsReadOnly ? "Review Document" : "Verify & Edit Extracted Data")}
                        </h1>
                        <div className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span className="mr-4">Supplier: <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{invoiceDetails?.supplier_name || '-'}</span></span>
                            <span>Invoice No: <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{invoiceDetails?.invoice_number || '-'}</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-gray-200' : 'bg-white text-gray-800'} ring-1 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/5'}`}>
                            <span className={`text-sm font-medium ${Math.abs(liveCalculatedAmount - liveInvoiceAmount) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                Calc: {liveCalculatedAmount.toFixed(2)}
                            </span>
                            <span className="text-sm opacity-50">/</span>
                            <span className="text-sm font-medium">Invoice: {liveInvoiceAmount.toFixed(2)}</span>
                        </div>
                        <button onClick={handleViewImage} className={secondaryButtonClasses} disabled>
                            <Eye className="w-4 h-4" /> View Image
                        </button>
                        {!finalIsReadOnly && user?.role === 'admin' && (
                            <button onClick={openRetryModal} className={secondaryButtonClasses}>
                                <RefreshCw className="w-4 h-4" /> Retry
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow py-6 md:py-8 overflow-y-auto">
                <div className="px-6 space-y-6 animate-fade-in-up">
                    <div className="space-y-5">
                        {formConfig.map((section) => {
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
                                                            tableData={productRows}
                                                            tableConfig={itemSummaryConfig}
                                                            isEditable={!finalIsReadOnly}
                                                            isSearchable={true}
                                                            renderActionCell={renderActionCell}
                                                            actionColumnHeader="Details"
                                                            pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25] }}
                                                            maxHeight="100%"
                                                            onDataChange={(newData) => setProductDetails(newData as ProductDetails[])}
                                                        />
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                                            {section.fields?.map((field: any) => (
                                                                <DynamicField
                                                                    key={field.key}
                                                                    label={field.label}
                                                                    name={field.key}
                                                                    value={getValue(field.key)}
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
                <footer className={`flex-shrink-0 py-4 border-t backdrop-blur-sm ${theme === 'dark' ? 'bg-[#1C1C2E]/80 border-slate-700' : 'bg-gray-50/80 border-slate-200'}`}>
                    <div className="px-6 flex justify-end">
                        {(isDirty || isManual) ? (
                            <button
                                onClick={handleValidateAndSave}
                                className={`flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-2.5 px-6 text-base rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 ${theme === 'dark' ? 'focus:ring-purple-800' : ''}`}
                            >
                                <Save className="w-5 h-5" /> Save
                            </button>
                        ) : (
                            <button
                                onClick={handleConfirm}
                                className={`flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2.5 px-6 text-base rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300 ${theme === 'dark' ? 'focus:ring-emerald-800' : ''}`}
                            >
                                <Check className="w-5 h-5" /> Confirm
                            </button>
                        )}
                    </div>
                </footer>
            )}
            <RetryModal isOpen={isRetryModalOpen} onClose={() => setRetryModalOpen(false)} onRetry={handleSimpleRetry} onRetryWithAlterations={handleRetryWithAlterations} />
            <ProductDetailPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} product={selectedProduct} onSave={handleSaveLineItems} isLoading={isLineItemsLoading} itemAttributesConfig={itemAttributesConfig} />
            <AnimatePresence>
                {isValidationOpen && validationInfo && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setValidationOpen(false)}></div>
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ring-1 ${theme === 'dark' ? 'bg-slate-900 text-gray-100 ring-slate-700' : 'bg-white text-gray-900 ring-slate-200'}`}>
                            <div className="p-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100"><AlertTriangle className="h-8 w-8 text-red-600" /></div>
                                <h3 className="mt-5 text-2xl font-bold tracking-tight">Amount Mismatch</h3>
                                <p className={`mt-3 text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>The calculated total from product items does not match the invoice total.</p>
                            </div>
                            <div className={`px-6 pb-6 space-y-4 text-base ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-700">
                                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Computed Amount</span><span className="font-mono text-lg font-semibold text-sky-400">{validationInfo.computed.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-700">
                                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Invoice Amount</span><span className="font-mono text-lg font-semibold text-emerald-400">{validationInfo.invoice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3">
                                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Difference</span><span className="font-mono text-lg font-semibold text-red-500">{(validationInfo.computed - validationInfo.invoice).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className={`px-6 py-4 flex justify-end gap-3 ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
                                <button onClick={() => setValidationOpen(false)} className={`px-5 py-2.5 text-base font-semibold rounded-lg transition-colors ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>Close</button>
                                <button onClick={handleForceSave} className="px-5 py-2.5 text-base font-semibold rounded-lg transition-all bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Force Save</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EditableComponent;