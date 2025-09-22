import { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import EditableComponent from '../components/common/EditableComponent';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';
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
} from '../lib/api/Api';
import type { InvoiceDetails, ProductDetails, AmountAndTaxDetails, FormSection, FormField } from '../interfaces/Types';
import { Save, CheckCircle } from 'lucide-react';

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
    const navigate = useNavigate();
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const messageId = location.state?.messageId;

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
                getInvoiceDetails(invoiceIdNum, addToast),
                getProductDetails(invoiceIdNum, addToast),
                getAmountAndTaxDetails(invoiceIdNum, addToast),
                getInvoiceConfig(addToast),
                getInvoiceMetaConfig(addToast),
                getItemSummaryConfig(addToast),
                getItemAttributesConfig(addToast),
            ]);

            if (!invoiceData || !productData || !amountData) {
                throw new Error("Failed to fetch all necessary details for the invoice. One or more primary API requests failed.");
            }

            setInvoiceDetails(invoiceData);
            setProductDetails(productData);
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

    const saveProductDetails = useCallback(async (newProduct: ProductDetails): Promise<ProductDetails> => {
        if (!invoiceId) throw new Error("Cannot save product without an invoice ID.");
        addToast({ type: 'info', message: 'Saving product row...' });
        try {
            const savedProduct: ProductDetails = await new Promise(resolve =>
                setTimeout(() => resolve({ ...newProduct, item_id: Date.now() }), 1000)
            );
            setProductDetails(currentProducts => {
                if (!currentProducts) return [savedProduct];
                return currentProducts.map(p => p.id === newProduct.id ? savedProduct : p);
            });
            addToast({ type: 'success', message: 'Product row saved successfully!' });
            return savedProduct;
        } catch (error: any) {
            addToast({ type: 'error', message: `Failed to save product row: ${error.message}` });
            throw error;
        }
    }, [invoiceId]);

    const handleFormChange = (newInvoiceDetails: InvoiceDetails, newProductDetails: ProductDetails[], newAmountAndTaxDetails: AmountAndTaxDetails) => {
        setInvoiceDetails(newInvoiceDetails);
        setProductDetails(newProductDetails);
        setAmountAndTaxDetails(newAmountAndTaxDetails);
        if (!isDirty) setIsDirty(true);
    };

    const handleSaveAsDraft = useCallback(async () => {
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
                updateInvoiceDetails(invoiceIdNum, invoiceDetails, addToast),
                updateProductDetails(invoiceIdNum, productDetails, addToast),
                updateAmountAndTaxDetails(invoiceIdNum, amountAndTaxDetails, addToast),
                // updateLineItems(invoiceIdNum, productDetails, addToast),
            ]);

            await confirmInvoice(messageId, { isEdited: true, state: 'Reviewed' }, addToast);

            addToast({ type: 'success', message: 'Draft saved successfully!' });
            setIsDirty(false);
            navigate('/document');

        } catch (error: any) {
            addToast({ type: 'error', message: `Failed to save draft: ${error.message}` });
        } finally {
            setIsSaving(false);
        }
    }, [invoiceId, messageId, invoiceDetails, productDetails, amountAndTaxDetails, isDirty, addToast, navigate]);

    const handleFinalize = useCallback(async () => {
        if (!messageId) {
            addToast({ type: 'error', message: 'Missing message ID.' });
            return;
        }

        setIsSaving(true);
        addToast({ type: 'info', message: 'Finalizing invoice...' });

        try {
            await confirmInvoice(messageId, { isEdited: isDirty, state: 'Completed' }, addToast);
            addToast({ type: 'success', message: 'Invoice finalized successfully!' });
            setIsDirty(false);
            navigate('/document');

        } catch (error: any) {
            addToast({ type: 'error', message: `Failed to finalize invoice: ${error.message}` });
        } finally {
            setIsSaving(false);
        }
    }, [messageId, isDirty, navigate]);

    if (isLoading) return <Loader type="wifi" />;
    if (error) return <div className="p-4"><ErrorDisplay message={error} onRetry={fetchData} /></div>;

    if (invoiceDetails && productDetails && amountAndTaxDetails && formConfig && itemSummaryConfig && itemAttributesConfig) {
        return (
            <EditableComponent
                initialInvoiceDetails={invoiceDetails}
                initialProductDetails={productDetails}
                initialAmountAndTaxDetails={amountAndTaxDetails}
                isReadOnly={false}
                messageId={messageId}
                formConfig={formConfig}
                itemSummaryConfig={itemSummaryConfig}
                itemAttributesConfig={itemAttributesConfig}
                onSaveNewProduct={saveProductDetails}
                onFormChange={handleFormChange}
                footer={
                    <div className="flex justify-end gap-4 p-4">
                        <button
                            onClick={handleSaveAsDraft}
                            disabled={!isDirty || isSaving}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out"
                        >
                            <Save size={16} />
                            Save as Draft
                        </button>
                        <button
                            onClick={handleFinalize}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
                        >
                           <CheckCircle size={16} />
                           Finalize
                        </button>
                    </div>
                }
            />
        );
    }

    return <div className="p-4"><ErrorDisplay message="Could not display invoice data." onRetry={fetchData} /></div>;
};

export default Edit;