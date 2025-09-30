import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Save, Eye, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import type { InvoiceDetails, ProductDetails, AmountAndTaxDetails, DataItem, EditableComponentProps } from '../../interfaces/Types';
import DataTable from './DataTable';
import { DynamicField } from './DynamicField';
import { RetryModal } from './Helper';
import ProductDetailPopup from './ProductDetailsPopup';
import { useToast } from '../../hooks/useToast';
import { set, get, cloneDeep } from 'lodash';
import { useParams } from 'react-router-dom';
import { retryMessage, getInvoicePdfFilename } from '../../lib/api/Api';
import { accordionVariants } from './Animation';
import ErrorHandler from './ErrorHandler';

const initialEmptyInvoiceDetails: InvoiceDetails = {
    supplier_id: 0,
    invoice_id: 0,
    invoice_number: '',
    irn: '',
    invoice_date: null,
    way_bill: '',
    acknowledgement_number: '',
    acknowledgement_date: null,
    created_at: null,
    order_number: null,
    order_date: null,
    supplier_name: '',
    supplier_address: '',
    supplier_gst: '',
    supplier_code: '',
    merchandiser_name: ''
};

const initialEmptyProductDetails: ProductDetails[] = [];

const initialEmptyAmountAndTaxDetails: AmountAndTaxDetails = {
    invoice_id: 0,
    meta_id: 0,
    invoice_amount: 0,
    taxable_value: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    igst_percentage: null,
    total_tax_amount: 0,
    other_deductions: 0,
    freight_charges: 0,
    other_charges: 0,
    round_off_amount: 0,
    misc_additions: 0,
    misc_deductions: 0,
    discount_id: 0,
    discount_percentage: 0,
    discount_amount: 0,
    discount_round_off: 0,
};

const EditableComponent = ({
    isManual = false,
    initialInvoiceDetails,
    initialProductDetails,
    initialAmountAndTaxDetails,
    isReadOnly = false,
    messageId,
    formConfig,
    itemSummaryConfig,
    itemAttributesConfig,
    onSaveNewProduct,
    onFormChange,
    onValidationChange,
    onUnsavedRowsChange,
    footer,
    renderActionCell: passedRenderActionCell
}: EditableComponentProps) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
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
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(formConfig.map(s => s.id)));
    const [hasValidationErrors, setHasValidationErrors] = useState<boolean>(false);
    const [hasUnsavedRows, setHasUnsavedRows] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const productRows = useMemo(() => {
        if (!productDetails) {
            return [];
        }
        return Array.isArray(productDetails) ? productDetails : (productDetails as any).items || [];
    }, [productDetails]);

    const liveCalculatedAmount = useMemo(() => (
        productRows.reduce((sum: number, row: any) => sum + (Number(row?.total_amount) || 0), 0)
    ), [productRows]);

    const liveTaxableValue = useMemo(() => Number((amountDetails as any)?.taxable_value) || 0, [amountDetails]);

    useEffect(() => {
        if (onFormChange) {
            onFormChange(invoiceDetails, productDetails as ProductDetails[], amountDetails);
        }
    }, [invoiceDetails, productDetails, amountDetails, onFormChange]);

    const handleValidationChange = useCallback((hasErrors: boolean) => {
        setHasValidationErrors(hasErrors);
        if (onValidationChange) {
            onValidationChange(hasErrors);
        }
    }, [onValidationChange]);

    const handleUnsavedRowsChange = useCallback((hasUnsaved: boolean) => {
        setHasUnsavedRows(hasUnsaved);
        if (onUnsavedRowsChange) {
            onUnsavedRowsChange(hasUnsaved);
        }
    }, [onUnsavedRowsChange]);

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

    const handleViewImage = async () => {
        if (!messageId) {
            setError("Message ID is not available.");
            return;
        }
        try {
            const response = await getInvoicePdfFilename(messageId);
            if (response && response.original_filename) {
                const filePath = `/src/invoice-pdf/${response.original_filename}`;

                fetch(filePath, { method: 'HEAD' })
                    .then(res => {
                        const contentType = res.headers.get('Content-Type');
                        if (res.ok && contentType && !contentType.includes('text/html')) {
                            window.open(filePath, '_blank');
                        } else {
                            setError(`File not found: ${response.original_filename}`);
                        }
                    })
                    .catch(() => {
                        setError(`File not found: ${response.original_filename}`);
                    });
            } else {
                setError("Could not retrieve file information.");
            }
        } catch (err: any) {
            if (err.statusCode === 422) {
                setError("Unprocessable Entity: The request was well-formed but was unable to be followed due to semantic errors.");
            } else {
                setError(err.message || "An unexpected error occurred.");
            }
        }
    };

    const handleSimpleRetry = async () => {
        setRetryModalOpen(false);
        if (messageId) {
            await retryMessage(messageId);
        }
    };
    const handleRetryWithAlterations = () => {
        setRetryModalOpen(false);
        navigate("/imageAlteration", { state: { messageId: messageId } });
    };

    const secondaryButtonClasses = `flex items-center gap-1.5 font-semibold py-2 px-4 text-sm rounded-lg transition-colors border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 ${theme === 'dark' ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 ring-offset-[#1C1C2E]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 ring-offset-gray-50'}`;

    const handleOpenPopup = (product: ProductDetails) => {
        if (isManual || !product.item_id) {
            addToast({ type: 'error', message: 'Cannot view details for an unsaved item.' });
            return;
        }
        setSelectedProduct(product);
        setIsPopupOpen(true);
    };

    const handleSaveLineItems = (edited: boolean) => {
        if (edited) {
            // Unused
        }
    };

    const handleSaveRow = useCallback(async (productRow: ProductDetails) => {
        if (hasValidationErrors) {
            addToast({ type: 'error', message: 'Please fix validation errors before saving.' });
            return;
        }
        if (onSaveNewProduct) {
            try {
                await onSaveNewProduct(productRow);
            } catch (error) {
                console.error("Failed to save product row from EditableComponent", error);
            }
        }
    }, [onSaveNewProduct, hasValidationErrors]);

    const renderActionCell = (row: DataItem) => {
        const productRow = row as unknown as ProductDetails;
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
                    className="p-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-emerald-300"
                    title="Save Row"
                    disabled={hasValidationErrors}
                >
                    <Save size={16} />
                </button>
            );
        }
    };

    const getValue = (path: string) => get(combinedData, path, '');

    const toggleAccordion = (id: string) => {
        setOpenAccordions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    if (error) {
        return <ErrorHandler errorMessage={error} />;
    }

    return (
      <div className={`h-full flex flex-col rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C2E] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
           <header className={`sticky top-0 z-20 px-6 py-4 border-b backdrop-blur-md ${theme === 'dark' ? 'bg-[#1C1C2E]/80 border-slate-700' : 'bg-gray-50/80 border-slate-200'}`}>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div className="min-w-0">
                        <h1 className={`text-xl md:text-2xl font-bold leading-tight ${theme === 'dark' ? 'text-gray-50' : 'text-gray-900'}`}>
                            {isManual ? "Manual Entry" : (isReadOnly ? "Review Document" : "Verify & Edit Extracted Data")}
                        </h1>
                        <div className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span className="mr-4">Supplier: <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{invoiceDetails?.supplier_name || '-'}</span></span>
                            <span>Invoice No: <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{invoiceDetails?.invoice_number || '-'}</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-gray-200' : 'bg-white text-gray-800'} ring-1 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/5'}`}>
                            <span className={`text-sm font-medium ${Math.abs(liveCalculatedAmount - liveTaxableValue) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                Calc: {liveCalculatedAmount.toFixed(2)}
                            </span>
                            <span className="text-sm opacity-50">/</span>
                            <span className="text-sm font-medium">Invoice: {liveTaxableValue.toFixed(2)}</span>
                        </div>
                        <button onClick={handleViewImage} className={`${secondaryButtonClasses}`}>
                            <Eye className="w-4 h-4" /> View Image
                        </button>
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
                                                            isEditable={!isReadOnly}
                                                            isSearchable={true}
                                                            renderActionCell={passedRenderActionCell || renderActionCell}
                                                            actionColumnHeader="Details"
                                                            pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25] }}
                                                            maxHeight="100%"
                                                            onDataChange={(newData) => setProductDetails(newData as unknown as ProductDetails[])}
                                                            onValidationChange={handleValidationChange}
                                                            onUnsavedRowsChange={handleUnsavedRowsChange}
                                                        />
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                                            {section.fields?.map((field: any) => (
                                                                <DynamicField
                                                                    key={field.key}
                                                                    type={field.type}
                                                                    isRequired={field.isRequired}
                                                                    isCurrency={field.isCurrency}
                                                                    label={field.label}
                                                                    name={field.key}
                                                                    value={getValue(field.key)}
                                                                    onChange={handleInputChange}
                                                                    disabled={isReadOnly}
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

            {!isReadOnly && footer}

            <RetryModal isOpen={isRetryModalOpen} onClose={() => setRetryModalOpen(false)} onRetry={handleSimpleRetry} onRetryWithAlterations={handleRetryWithAlterations} />
            <ProductDetailPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                product={selectedProduct}
                onSave={handleSaveLineItems}
                onViewImage={handleViewImage}
                itemAttributesConfig={itemAttributesConfig}
                invoiceId={parseInt(invoiceId!, 10)}
                isReadOnly={isReadOnly}
            />
        </div>
    );
};

export default EditableComponent;