import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Save, Eye, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import type { InvoiceDetails, ProductDetails, AmountAndTaxDetails, DataItem, LineItem } from '../../interfaces/Types';
import DataTable from './DataTable';
import { DynamicField } from './DynamicField';
import { RetryModal } from './Helper';
import ProductDetailPopup from './ProductDetailsPopup';
import { formConfig, itemSummaryConfig } from '../../lib/config/Config';
import { useToast } from '../../hooks/useToast';
import { set, get, cloneDeep, isEqual } from 'lodash';
import { getLineItems, updateLineItems, updateInvoiceDetails, updateProductDetails, updateAmountAndTaxDetails, confirmInvoice } from '../../lib/api/Api';
import { useParams } from 'react-router-dom';

// --- Default Empty States for Manual Entry ---
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
    discount_percentage: 0, // Added discount_percentage
    discount_amount: 0,     // Added discount_amount
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
};

const EditableComponent = ({
    isManual = false,
    initialInvoiceDetails,
    initialProductDetails,
    initialAmountAndTaxDetails,
    isReadOnly = false,
    onRetry,
    messageId
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
    // Allow multiple accordions to stay open
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(formConfig.length ? [formConfig[0].id] : []));
    const [isDirty, setIsDirty] = useState(false);
    // Validation modal state
    const [isValidationOpen, setValidationOpen] = useState(false);
    const [validationInfo, setValidationInfo] = useState<{ computed: number; invoice: number } | null>(null);

    // Normalized current product rows and live-calculated sum for header display
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
            setInvoiceDetails(prevState => {
                const newState = cloneDeep(prevState);
                set(newState, name, value);
                return newState;
            });
        } else if (isAmountField) {
            setAmountDetails(prevState => {
                const newState = cloneDeep(prevState);
                set(newState, name, value);
                return newState;
            });
        }
    };
    
    const handleViewImage = () => {
        addToast({ type: 'error', message: 'Image view functionality is not yet connected.' });
    };

    const openRetryModal = () => setRetryModalOpen(true);
    const handleSimpleRetry = () => { setRetryModalOpen(false); if (onRetry) onRetry(); };
    const handleRetryWithAlterations = () => { setRetryModalOpen(false); navigate('/imageAlteration'); };

    const finalIsReadOnly = isReadOnly;

    const secondaryButtonClasses = `
    flex items-center gap-1.5 font-semibold py-2 px-4 text-sm rounded-lg transition-colors
    border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500
    ${theme === 'dark'
            ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 ring-offset-[#1C1C2E]'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 ring-offset-gray-50'
        }`;

    const handleOpenPopup = async (product: ProductDetails) => {
        if (isManual) {
            addToast({ type: 'error', message: 'Cannot view details for an unsaved invoice.' });
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
            addToast({ type: "error", message: err.message || "Failed to fetch line items."});
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

    const renderActionCell = (row: DataItem) => {
        const productRow = row as unknown as ProductDetails;
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
    };
    
    const accordionVariants: Variants = {
        open: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeInOut' } },
        collapsed: { opacity: 0, height: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
    };

    const getValue = (path: string) => get(combinedData, path, '');

    // Toggle accordion without closing others
    const toggleAccordion = (id: string) => {
        setOpenAccordions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    
    const handleValidateAndSave = async () => {
        if (!invoiceId) return;

        // Cross-check live calculated vs invoice amount before saving
        const computed = liveCalculatedAmount;
        const invoiceAmt = liveInvoiceAmount;
        if (Math.abs(computed - invoiceAmt) >= 0.01) {
            setValidationInfo({ computed, invoice: invoiceAmt });
            setValidationOpen(true);
            return;
        }

        const invoiceIdNum = parseInt(invoiceId, 10);

        const [savedInvoice, savedProducts, savedAmount] = await Promise.all([
            updateInvoiceDetails(invoiceIdNum, invoiceDetails, addToast),
            updateProductDetails(invoiceIdNum, productDetails, addToast),
            updateAmountAndTaxDetails(invoiceIdNum, amountDetails, addToast),
        ]);

        if (savedInvoice) setInvoiceDetails(savedInvoice);
        if (savedProducts) setProductDetails(savedProducts);
        if (savedAmount) setAmountDetails(savedAmount);

        if (savedInvoice && savedProducts && savedAmount) {
            navigate('/document');
        }
    };
    
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
    
    return (
        <div className={`h-full flex flex-col rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C2E] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
            {/* Sticky Header */}
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
                                                            tableData={Array.isArray(productDetails) ? (productDetails as any[]) : ((productDetails as any)?.items || [])}
                                                            tableConfig={itemSummaryConfig}
                                                            isEditable={!finalIsReadOnly}
                                                            isSearchable={true}
                                                            renderActionCell={renderActionCell}
                                                            actionColumnHeader="Details"
                                                            pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25] }}
                                                            maxHeight="100%"
                                                            onDataChange={(newData) => {
                                                                if (Array.isArray(productDetails)) {
                                                                    setProductDetails(newData as ProductDetails[]);
                                                                } else {
                                                                    const pd: any = productDetails || {};
                                                                    setProductDetails({ ...pd, items: newData } as any);
                                                                }
                                                            }}
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

            <RetryModal
                isOpen={isRetryModalOpen}
                onClose={() => setRetryModalOpen(false)}
                onRetry={handleSimpleRetry}
                onRetryWithAlterations={handleRetryWithAlterations}
            />
            <ProductDetailPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                product={selectedProduct}
                onSave={handleSaveLineItems}
                isLoading={isLineItemsLoading}
            />
            <AnimatePresence>
                {isValidationOpen && validationInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setValidationOpen(false)}></div>
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                            className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden ring-1 ${theme === 'dark' ? 'bg-[#151525] text-gray-100 ring-white/10' : 'bg-white text-gray-900 ring-black/5'}`}
                        >
                            <div className={`px-5 py-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                                <h3 className="text-base font-semibold tracking-tight">Computed amount does not match invoice amount</h3>
                            </div>
                            <motion.div
                                className="px-5 py-5 text-sm space-y-4"
                                initial="hidden"
                                animate="visible"
                                variants={{ hidden: { transition: { staggerChildren: 0.02, staggerDirection: -1 } }, visible: { transition: { staggerChildren: 0.06 } } }}
                            >
                                <motion.p variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                                    Please adjust the calculated field(s) so that the computed amount equals the invoice amount.
                                </motion.p>
                                <div className="space-y-1.5">
                                    <motion.div variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }} className="flex justify-between"><span className="opacity-70">Computed amount</span><span className="font-medium">{validationInfo.computed.toFixed(2)}</span></motion.div>
                                    <motion.div variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }} className="flex justify-between"><span className="opacity-70">Invoice amount</span><span className="font-medium">{validationInfo.invoice.toFixed(2)}</span></motion.div>
                                    <motion.div variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }} className="flex justify-between"><span className="opacity-70">Difference</span><span className="font-medium">{(validationInfo.computed - validationInfo.invoice).toFixed(2)}</span></motion.div>
                                </div>
                            </motion.div>
                            <div className={`px-5 py-4 border-t flex justify-end gap-2 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                                <button onClick={() => setValidationOpen(false)} className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${theme === 'dark' ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200'}`}>Close</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EditableComponent;