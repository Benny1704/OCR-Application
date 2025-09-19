import { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import EditableComponent from '../components/common/EditableComponent';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';
import { useToast } from '../hooks/useToast';
// Make sure to import your actual API function to save a product when it's ready
import { 
    getInvoiceDetails, 
    getProductDetails, 
    getAmountAndTaxDetails, 
    getInvoiceConfig, 
    getInvoiceMetaConfig, 
    getItemSummaryConfig, 
    getItemAttributesConfig 
    //, saveProductDetails as saveProductDetailsAPI 
} from '../lib/api/Api';
import type { InvoiceDetails, ProductDetails, AmountAndTaxDetails, FormSection, FormField } from '../interfaces/Types';

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
                {
                    id: 'supplier_invoice',
                    title: 'Supplier & Invoice Details',
                    fields: invoiceConfigData.fields,
                },
                {
                    id: 'product_details',
                    title: 'Product Details',
                },
                {
                    id: 'amount_details',
                    title: 'Amount & Tax Details',
                    fields: invoiceMetaConfigData.fields,
                },
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
        if (!invoiceId) {
            throw new Error("Cannot save product without an invoice ID.");
        }
        
        addToast({ type: 'info', message: 'Saving product row...' });

        try {
            // ** REPLACE THIS MOCK WITH YOUR REAL API CALL **
            // const savedProduct = await saveProductDetailsAPI(parseInt(invoiceId, 10), newProduct, addToast);
            
            // Mocking the API call for demonstration
            const savedProduct: ProductDetails = await new Promise(resolve => 
                setTimeout(() => {
                    const productWithId = { 
                        ...newProduct, 
                        item_id: Date.now(), // This ID would come from the backend
                    };
                    resolve(productWithId);
                }, 1000)
            );
            // ** END OF MOCK **

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

    if (isLoading) {
        return <Loader type="wifi" />;
    }

    if (error) {
        return <div className="p-4"><ErrorDisplay message={error} onRetry={fetchData} /></div>;
    }

    if (invoiceDetails && productDetails && amountAndTaxDetails && formConfig && itemSummaryConfig && itemAttributesConfig) {
        return (
            <EditableComponent
                initialInvoiceDetails={invoiceDetails}
                initialProductDetails={productDetails}
                initialAmountAndTaxDetails={amountAndTaxDetails}
                isReadOnly={false}
                messageId={location.state?.messageId}
                formConfig={formConfig}
                itemSummaryConfig={itemSummaryConfig}
                itemAttributesConfig={itemAttributesConfig}
                onSaveNewProduct={saveProductDetails}
            />
        );
    }

    return <div className="p-4"><ErrorDisplay message="Could not display invoice data." onRetry={fetchData} /></div>;
};

export default Edit;