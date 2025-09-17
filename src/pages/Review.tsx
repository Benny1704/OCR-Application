import { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import EditableComponent from '../components/common/EditableComponent';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';
import { useToast } from '../hooks/useToast';
import { getInvoiceDetails, getProductDetails, getAmountAndTaxDetails, getInvoiceConfig, getInvoiceMetaConfig, getItemSummaryConfig, getItemAttributesConfig } from '../lib/api/Api';
import type { InvoiceDetails, ProductDetails, AmountAndTaxDetails, FormSection, FormField } from '../interfaces/Types';

const Review = () => {
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

            // Construct formConfig
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
    }, [invoiceId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                isReadOnly={true}
                messageId={location.state?.messageId}
                formConfig={formConfig}
                itemSummaryConfig={itemSummaryConfig}
                itemAttributesConfig={itemAttributesConfig}
            />
        );
    }

    return <div className="p-4"><ErrorDisplay message="Could not display invoice data." onRetry={fetchData} /></div>;
};

export default Review;