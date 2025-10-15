import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import EditableComponent from '../components/common/EditableComponent';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';
import ProductDetailPopup from '../components/common/ProductDetailsPopup';
import { ConfirmationModal, WarningConfirmationModal } from '../components/common/Helper';
import { useToast } from '../hooks/useToast';
import {
    getInvoiceDetails,
    getProductDetails,
    getAmountAndTaxDetails,
    getInvoiceConfig,
    getInvoiceMetaConfig,
    getItemSummaryConfig,
    getItemAttributesConfig,
    updateInvoiceDetails,
    updateProductDetails,
    updateAmountAndTaxDetails,
    confirmInvoice,
    manualInvoiceEntryItemSummary,
} from '../lib/api/Api';
import type { InvoiceDetails, ProductDetails, AmountAndTaxDetails, FormSection, FormField, DataItem } from '../interfaces/Types';
import { Save, CheckCircle, Eye, AlertTriangle } from 'lucide-react';
import { ViewImageAbsPath } from '../lib/config/Config';
import { useAppNavigation } from '../hooks/useAppNavigation';

const Edit = () => {
    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
    const [productDetails, setProductDetails] = useState<ProductDetails[] | null>(null);
    const [amountAndTaxDetails, setAmountAndTaxDetails] = useState<AmountAndTaxDetails | null>(null);
    const [formConfig, setFormConfig] = useState<FormSection[] | null>(null);
    const [itemSummaryConfig, setItemSummaryConfig] = useState<{ columns: FormField[] } | null>(null);
    const [itemAttributesConfig, setItemAttributesConfig] = useState<{ columns: FormField[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const location = useLocation();
    const { navigate } = useAppNavigation();
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savingRowId, setSavingRowId] = useState<string | number | null>(null);
    const [hasValidationErrors, setHasValidationErrors] = useState<boolean>(false);
    const [hasMandatoryFieldsError, setHasMandatoryFieldsError] = useState<boolean>(false);
    const [hasUnsavedRows, setHasUnsavedRows] = useState<boolean>(false);

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);

    const [isAmountMismatchModalOpen, setAmountMismatchModalOpen] = useState(false);
    const [isFinalizeModalOpen, setFinalizeModalOpen] = useState(false);
    const [isUnsavedRowsModalOpen, setUnsavedRowsModalOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'save' | 'finalize' | null>(null);

    const messageId = location.state?.messageId;

    const liveCalculatedAmount = useMemo(() => {
        if (!productDetails) {
            return 0;
        }
        return productDetails.reduce((sum: number, row: any) => sum + (Number(row?.total_amount) || 0), 0);
    }, [productDetails]);

    const liveTaxableValue = useMemo(() => {
        return Number(amountAndTaxDetails?.taxable_value) || 0;
    }, [amountAndTaxDetails]);

    // Check if any row has incomplete mandatory fields
    const hasIncompleteMandatoryFields = useCallback((row: ProductDetails): boolean => {
        if (!itemSummaryConfig) return false;
        const requiredColumns = itemSummaryConfig.columns.filter(col => col.isRequired && col.key !== 'sno');
        return requiredColumns.some(col => {
            const value = row[col.key as keyof ProductDetails];
            return value === null || value === undefined || String(value).trim() === '';
        });
    }, [itemSummaryConfig]);

    useEffect(() => {
        if (formConfig && invoiceDetails && amountAndTaxDetails) {
            for (const section of formConfig) {
                if (section.fields) {
                    for (const field of section.fields) {
                        if (field.isRequired) {
                            const value = (invoiceDetails as any)[field.key] ?? (amountAndTaxDetails as any)[field.key];
                            if (value === null || value === undefined || value === '') {
                                setHasMandatoryFieldsError(true);
                                return;
                            }
                        }
                    }
                }
            }
            setHasMandatoryFieldsError(false);
        }
    }, [formConfig, invoiceDetails, amountAndTaxDetails]);

    const fetchData = useCallback(async () => {
        if (!invoiceId) {
            setError("No invoice ID provided in the URL.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const invoiceIdNum = parseInt(invoiceId, 10);
            if (isNaN(invoiceIdNum)) {
                throw new Error("The invoice ID in the URL is invalid.");
            }

            const [
                invoiceData,
                productData,
                amountData,
                invoiceConfigData,
                invoiceMetaConfigData,
                itemSummaryConfigData,
                itemAttributesConfigData,
            ] = await Promise.all([
                getInvoiceDetails(invoiceIdNum),
                getProductDetails(invoiceIdNum),
                getAmountAndTaxDetails(invoiceIdNum),
                getInvoiceConfig(),
                getInvoiceMetaConfig(),
                getItemSummaryConfig(),
                getItemAttributesConfig(),
            ]);

            if (!invoiceData || !productData || !amountData) {
                throw new Error("Failed to fetch all necessary details for the invoice. One or more primary API requests failed.");
            }

            setInvoiceDetails(invoiceData);
            if (productData && 'items' in productData) {
                setProductDetails(productData.items || []);
            } else {
                setProductDetails(productData || []);
            }
            setAmountAndTaxDetails(amountData);

            const fetchedFormConfig: FormSection[] = [
                { id: 'supplier_invoice', title: 'Supplier & Invoice Details', fields: invoiceConfigData.fields },
                { id: 'product_details', title: 'Product Details' },
                { id: 'amount_details', title: 'Amount & Tax Details', fields: invoiceMetaConfigData.fields },
            ];

            setFormConfig(fetchedFormConfig);
            setItemSummaryConfig({ columns: itemSummaryConfigData.fields });
            setItemAttributesConfig({ columns: itemAttributesConfigData.fields });

        } catch (err: any) {
            setError(err.message || "An unknown error occurred while fetching invoice data.");
        } finally {
            setIsLoading(false);
        }
    }, [invoiceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveProductRow = useCallback(async (productRow: ProductDetails): Promise<ProductDetails> => {
        if (hasValidationErrors) {
            addToast({ type: 'error', message: 'Please fix validation errors before saving.' });
            throw new Error('Validation errors');
        }

        // Check for incomplete mandatory fields
        if (hasIncompleteMandatoryFields(productRow)) {
            addToast({ type: 'error', message: 'Please fill all mandatory fields before saving.' });
            throw new Error('Incomplete mandatory fields');
        }

        if (!invoiceId) throw new Error("Cannot save product without an invoice ID.");

        const temporaryRowId = productRow.id;
        setSavingRowId(temporaryRowId);
        addToast({ type: 'info', message: 'Saving product row...' });

        const payload = {
            items: [
                {
                    invoice_id: parseInt(invoiceId, 10),
                    total_quantity: Number(productRow.total_quantity) || 0,
                    total_pieces: Number(productRow.total_pieces) || 0,
                    total_amount: Number(productRow.total_amount) || 0,
                    gst_percentage: Number(productRow.gst_percentage) || 0,
                    style_code: productRow.style_code || "",
                    category: productRow.category || "",
                    uom: productRow.uom || "",
                    design_code: productRow.design_code || ""
                }
            ]
        };

        try {
            const response = await manualInvoiceEntryItemSummary(payload);
            if (response && response.status === 'success' && response.data?.length > 0) {
                addToast({ type: 'success', message: 'Product row saved successfully!' });

                const updatedProductDetails = await getProductDetails(parseInt(invoiceId, 10));

                if (Array.isArray(updatedProductDetails)) {
                    setProductDetails(updatedProductDetails);
                    if (!isDirty) setIsDirty(true);
                    const savedProduct = updatedProductDetails.find((p: { item_id: number; }) => p.item_id === response.data[0].item_id);
                    return savedProduct || { ...response.data[0], id: response.data[0].item_id };
                } else {
                    fetchData();
                    return { ...response.data[0], id: response.data[0].item_id };
                }
            } else {
                throw new Error(response.message || 'Failed to save product row.');
            }
        } catch (error: any) {
            addToast({ type: 'error', message: `Failed to save product row` });
            throw error;
        } finally {
            setSavingRowId(null);
        }
    }, [invoiceId, isDirty, fetchData, hasValidationErrors, hasIncompleteMandatoryFields]);

    const handleFormChange = (newInvoiceDetails: InvoiceDetails, newProductDetails: ProductDetails[], newAmountAndTaxDetails: AmountAndTaxDetails) => {
        setInvoiceDetails(newInvoiceDetails);
        setProductDetails(newProductDetails);
        setAmountAndTaxDetails(newAmountAndTaxDetails);
        if (!isDirty) setIsDirty(true);
    };

    const proceedWithSaveAsDraft = useCallback(async () => {
        if (hasValidationErrors) {
            addToast({ type: 'error', message: 'Please fix validation errors before saving.' });
            return;
        }
        if (!invoiceId || !messageId || !invoiceDetails || !productDetails || !amountAndTaxDetails) {
            addToast({ type: 'error', message: 'Missing data to save.' });
            return;
        }

        if (!isDirty) {
            addToast({ type: 'info', message: 'No changes to save.' });
            return;
        }

        setIsSaving(true);
        addToast({ type: 'info', message: 'Saving draft...' });

        try {
            const invoiceIdNum = parseInt(invoiceId, 10);

            await Promise.all([
                updateInvoiceDetails(invoiceIdNum, invoiceDetails),
                updateProductDetails(invoiceIdNum, { items: productDetails }),
                updateAmountAndTaxDetails(invoiceIdNum, amountAndTaxDetails),
            ]);

            await confirmInvoice(messageId, { isEdited: true, state: 'Reviewed' });

            addToast({ type: 'success', message: 'Draft saved successfully!' });
            setIsDirty(false);

        } catch (error: any) {
            addToast({ type: 'error', message: `Failed to save draft` });
        } finally {
            setIsSaving(false);
        }
    }, [invoiceId, messageId, invoiceDetails, productDetails, amountAndTaxDetails, isDirty, hasValidationErrors]);

    const proceedWithFinalize = useCallback(async () => {
        if (hasValidationErrors) {
            addToast({ type: 'error', message: 'Please fix validation errors before finalizing.' });
            return;
        }
        if (!messageId) {
            addToast({ type: 'error', message: 'Missing message ID.' });
            return;
        }

        setIsSaving(true);
        addToast({ type: 'info', message: 'Finalizing invoice...' });

        try {
            if (isDirty) {
                if (!invoiceId || !invoiceDetails || !productDetails || !amountAndTaxDetails) {
                    throw new Error('Missing data to save before finalizing.');
                }
                const invoiceIdNum = parseInt(invoiceId, 10);
                await Promise.all([
                    updateInvoiceDetails(invoiceIdNum, invoiceDetails),
                    updateProductDetails(invoiceIdNum, { items: productDetails }),
                    updateAmountAndTaxDetails(invoiceIdNum, amountAndTaxDetails),
                ]);
            }

            await confirmInvoice(messageId, { isEdited: isDirty, state: 'Completed' });
            addToast({ type: 'success', message: 'Invoice finalized successfully!' });
            setIsDirty(false);
            navigate('/document');

        } catch (error: any) {
            addToast({ type: 'error', message: `Failed to finalize invoice` });
        } finally {
            setIsSaving(false);
        }
    }, [messageId, isDirty, navigate, invoiceId, invoiceDetails, productDetails, amountAndTaxDetails, hasValidationErrors]);

    const handleSaveAsDraft = () => {
        if (hasValidationErrors || hasMandatoryFieldsError) {
            addToast({ type: 'error', message: 'Please fix validation errors and fill all mandatory fields before saving.' });
            return;
        }

        // Check for unsaved rows
        if (hasUnsavedRows) {
            setActionToConfirm('save');
            setUnsavedRowsModalOpen(true);
            return;
        }

        // Check for amount mismatch
        if (Math.abs(liveCalculatedAmount - liveTaxableValue) > 0.01) {
            setActionToConfirm('save');
            setAmountMismatchModalOpen(true);
        } else {
            proceedWithSaveAsDraft();
        }
    };

    const handleFinalize = () => {
        if (hasValidationErrors || hasMandatoryFieldsError) {
            addToast({ type: 'error', message: 'Please fix validation errors and fill all mandatory fields before finalizing.' });
            return;
        }

        // Check for unsaved rows
        if (hasUnsavedRows) {
            setActionToConfirm('finalize');
            setUnsavedRowsModalOpen(true);
            return;
        }

        // Check for amount mismatch
        if (Math.abs(liveCalculatedAmount - liveTaxableValue) > 0.01) {
            setActionToConfirm('finalize');
            setAmountMismatchModalOpen(true);
        } else {
            setFinalizeModalOpen(true);
        }
    };

    const handleForceProceed = () => {
        setAmountMismatchModalOpen(false);
        if (actionToConfirm === 'save') {
            proceedWithSaveAsDraft();
        } else if (actionToConfirm === 'finalize') {
            setFinalizeModalOpen(true);
        }
    };

    const handleOpenPopup = useCallback((product: ProductDetails) => {
        setSelectedProduct(product);
        setIsPopupOpen(true);
    }, []);

    const renderActionCell = useCallback((row: DataItem) => {
        const productRow = row as ProductDetails;
        const isSaved = !!productRow.item_id && typeof productRow.item_id === 'number' && productRow.item_id > 0;
        const isSavingThisRow = savingRowId === productRow.id;
        const hasIncompleteFields = hasIncompleteMandatoryFields(productRow);

        return (
            <div className="text-center">
                {isSavingThisRow ? (
                    <Loader type="btnLoader" />
                ) : isSaved ? (
                     <button
                        onClick={() => handleOpenPopup(productRow)}
                        className="p-1.5 rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        title="View Details"
                    >
                        <Eye size={16} />
                    </button>
                ) : (
                    <button
                        onClick={() => handleSaveProductRow(productRow)}
                        disabled={isSaving || hasValidationErrors || hasIncompleteFields}
                        className="p-1.5 rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                        title={hasIncompleteFields ? "Please fill all mandatory fields" : "Save Row"}
                    >
                        <Save size={16} />
                    </button>
                )}
            </div>
        );
    }, [savingRowId, isSaving, handleOpenPopup, handleSaveProductRow, hasValidationErrors, hasIncompleteMandatoryFields]);

    const handleViewImage = async () => {
        if (!messageId) {
            addToast({ type: 'error', message: 'Message ID is not available.' });
            return;
        }
        try {
            const fileUrl = `${ViewImageAbsPath}${messageId}`;
            window.open(fileUrl, '_blank');

            // const pdfBlob = await getFile(messageId);
            // const tempUrl = URL.createObjectURL(pdfBlob);
            // window.open(tempUrl, '_blank');
            
        } catch (err: any) {
            if (err.statusCode === 422) {
                setError("Unprocessable Entity: The request was well-formed but was unable to be followed due to semantic errors.");
            } else {
                setError(err.message || "An unexpected error occurred.");
            }
        }
    };

    if (isLoading) return <Loader type="wifi" />;
    if (error) return <div className="p-4"><ErrorDisplay message={error} onRetry={fetchData} /></div>;

    if (invoiceDetails && productDetails && amountAndTaxDetails && formConfig && itemSummaryConfig && itemAttributesConfig) {
        return (
            <>
                <EditableComponent
                    initialInvoiceDetails={invoiceDetails}
                    initialProductDetails={productDetails}
                    initialAmountAndTaxDetails={amountAndTaxDetails}
                    isReadOnly={false}
                    messageId={messageId}
                    formConfig={formConfig}
                    itemSummaryConfig={itemSummaryConfig}
                    itemAttributesConfig={itemAttributesConfig}
                    onSaveNewProduct={handleSaveProductRow}
                    onFormChange={handleFormChange}
                    onValidationChange={setHasValidationErrors}
                    onUnsavedRowsChange={setHasUnsavedRows}
                    renderActionCell={renderActionCell}
                    footer={
                        <div className="flex justify-end gap-4 p-2.5">
                            <button
                                onClick={handleSaveAsDraft}
                                disabled={!isDirty || isSaving || hasValidationErrors || hasMandatoryFieldsError}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out"
                            >
                                <Save size={16} />
                                Save as Draft
                            </button>
                            <button
                                onClick={handleFinalize}
                                disabled={isSaving || hasValidationErrors || hasMandatoryFieldsError}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
                            >
                               <CheckCircle size={16} />
                               Finalize
                            </button>
                        </div>
                    }
                />
                <ProductDetailPopup
                    isOpen={isPopupOpen}
                    onClose={() => setIsPopupOpen(false)}
                    product={selectedProduct}
                    onSave={(dirty) => {
                        if (dirty) {
                            fetchData();
                        }
                    }}
                    onViewImage={handleViewImage}
                    itemAttributesConfig={itemAttributesConfig}
                    invoiceId={invoiceId ? parseInt(invoiceId, 10) : 0}
                />
                
                {/* Unsaved Rows Warning Modal */}
                <WarningConfirmationModal
                    isOpen={isUnsavedRowsModalOpen}
                    onClose={() => setUnsavedRowsModalOpen(false)}
                    onConfirm={() => setUnsavedRowsModalOpen(false)}
                    title="Unsaved Changes in Item Summary"
                    message="You have unsaved rows in the product details table. Please save all rows before proceeding, or they will be lost."
                    icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />}
                    showConfirmButton={false}
                />

                {/* Amount Mismatch Warning Modal */}
                <WarningConfirmationModal
                    isOpen={isAmountMismatchModalOpen}
                    onClose={() => setAmountMismatchModalOpen(false)}
                    onConfirm={handleForceProceed}
                    title="Amount Mismatch"
                    message={`The calculated total (${liveCalculatedAmount.toFixed(2)}) does not match the invoice total (${liveTaxableValue.toFixed(2)}). Are you sure you want to proceed?`}
                    icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />}
                />

                {/* Finalize Confirmation Modal */}
                <ConfirmationModal
                    isOpen={isFinalizeModalOpen}
                    onClose={() => setFinalizeModalOpen(false)}
                    onConfirm={() => {
                        setFinalizeModalOpen(false);
                        proceedWithFinalize();
                    }}
                    title="Finalize Invoice"
                    message="After finalizing, this invoice cannot be edited later. Are you sure you want to continue?"
                />
            </>
        );
    }

    return <div className="p-4"><ErrorDisplay message="Could not display invoice data." onRetry={fetchData} /></div>;
};

export default Edit;