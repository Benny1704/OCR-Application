import EditableComponent from '../components/common/EditableComponent';
import { useEffect, useState, useCallback } from 'react';
import { getInvoiceDetails, getProductDetails, getAmountAndTaxDetails } from '../lib/api/Api';
import type { InvoiceDetails, ProductDetails, AmountAndTaxDetails } from '../interfaces/Types';
import { useToast } from '../hooks/useToast';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';
import { useParams } from 'react-router-dom';

const Edit = () => {
    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
    const [productDetails, setProductDetails] = useState<ProductDetails[] | null>(null);
    const [amountAndTaxDetails, setAmountAndTaxDetails] = useState<AmountAndTaxDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();
    const { invoiceId } = useParams<{ invoiceId: string }>();

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

            // Fetch all three data sources in parallel for efficiency
            const [invoiceData, productData, amountData] = await Promise.all([
                getInvoiceDetails(invoiceIdNum, addToast),
                getProductDetails(invoiceIdNum, addToast),
                getAmountAndTaxDetails(invoiceIdNum, addToast)
            ]);

            // Check if any of the crucial data fetches failed
            if (!invoiceData || !productData || !amountData) {
                throw new Error("Failed to fetch all necessary details for the invoice.");
            }

            setInvoiceDetails(invoiceData);
            setProductDetails(productData);
            setAmountAndTaxDetails(amountData);

        } catch (err: any) {
            setError(err.message || "An unknown error occurred while fetching invoice data.");
            // Clear out any partial data to avoid an inconsistent state
            setInvoiceDetails(null);
            setProductDetails(null);
            setAmountAndTaxDetails(null);
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

    // Render the EditableComponent only when all data is successfully loaded
    if (invoiceDetails && productDetails && amountAndTaxDetails) {
        return (
            <EditableComponent
                initialInvoiceDetails={invoiceDetails}
                initialProductDetails={productDetails}
                initialAmountAndTaxDetails={amountAndTaxDetails}
            />
        );
    }

    // Fallback for a state where data isn't fully loaded but there's no error
    return <div className="p-4"><ErrorDisplay message="Could not display invoice data." onRetry={fetchData} /></div>;
};

export default Edit;