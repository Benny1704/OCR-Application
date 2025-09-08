import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditableComponent from '../components/common/EditableComponent';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';
import { useToast } from '../hooks/useToast';
import { getInvoiceDetails, getProductDetails, getAmountAndTaxDetails, getLineItems } from '../lib/api/Api';
import type { InvoiceDetails, ProductDetails, AmountAndTaxDetails } from '../interfaces/Types';

const Edit = () => {
    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
    const [productDetails, setProductDetails] = useState<ProductDetails[] | null>(null);
    const [amountAndTaxDetails, setAmountAndTaxDetails] = useState<AmountAndTaxDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const navigate = useNavigate();

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

            // Step 1: Fetch primary details
            const [invoiceData, productData, amountData] = await Promise.all([
                getInvoiceDetails(invoiceIdNum, addToast),
                getProductDetails(invoiceIdNum, addToast),
                getAmountAndTaxDetails(invoiceIdNum, addToast)
            ]);

            if (!invoiceData || !productData || !amountData) {
                throw new Error("Failed to fetch all necessary details for the invoice. One or more primary API requests failed.");
            }

            // Step 2: Fetch line items for each product and attach them
            const productsWithLineItems = await Promise.all(
                productData.map(async (product: ProductDetails) => {
                    const lineItems = await getLineItems(invoiceIdNum, product.id, addToast);
                    return { ...product, line_items: lineItems || [] };
                })
            );

            setInvoiceDetails(invoiceData);
            setProductDetails(productsWithLineItems);
            setAmountAndTaxDetails(amountData);

        } catch (err: any) {
            setError(err.message || "An unknown error occurred while fetching invoice data.");
        } finally {
            setIsLoading(false);
        }
    }, [invoiceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePreview = (
        editedInvoiceDetails: InvoiceDetails,
        editedProductDetails: ProductDetails[],
        editedAmountAndTaxDetails: AmountAndTaxDetails
    ) => {
        navigate(`/preview/${invoiceId}`, {
            state: {
                invoiceDetails: editedInvoiceDetails,
                productDetails: editedProductDetails,
                amountAndTaxDetails: editedAmountAndTaxDetails,
            },
        });
    };

    if (isLoading) {
        return <Loader type="wifi" />;
    }

    if (error) {
        return <div className="p-4"><ErrorDisplay message={error} onRetry={fetchData} /></div>;
    }

    if (invoiceDetails && productDetails && amountAndTaxDetails) {
        return (
            <EditableComponent
                initialInvoiceDetails={invoiceDetails}
                initialProductDetails={productDetails}
                initialAmountAndTaxDetails={amountAndTaxDetails}
                isReadOnly={false}
                onPreview={handlePreview}
            />
        );
    }

    return <div className="p-4"><ErrorDisplay message="Could not display invoice data." onRetry={fetchData} /></div>;
};

export default Edit;