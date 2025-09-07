// src/pages/Edit.tsx

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
    
    const [isInvoiceLoading, setIsInvoiceLoading] = useState(true);
    const [isProductLoading, setIsProductLoading] = useState(true);
    const [isAmountLoading, setIsAmountLoading] = useState(true);

    const [invoiceError, setInvoiceError] = useState<string | null>(null);
    const [productError, setProductError] = useState<string | null>(null);
    const [amountError, setAmountError] = useState<string | null>(null);

    const { addToast } = useToast();
    const { invoiceId } = useParams<{ invoiceId: string }>();

    const fetchData = useCallback(async () => {
        if (!invoiceId) {
            const errorMsg = "No invoice ID provided in the URL.";
            setInvoiceError(errorMsg);
            setProductError(errorMsg);
            setAmountError(errorMsg);
            setIsInvoiceLoading(false);
            setIsProductLoading(false);
            setIsAmountLoading(false);
            return;
        }

        const invoiceIdNum = parseInt(invoiceId, 10);
        if (isNaN(invoiceIdNum)) {
            const errorMsg = "The invoice ID in the URL is invalid.";
            setInvoiceError(errorMsg);
            setProductError(errorMsg);
            setAmountError(errorMsg);
            setIsInvoiceLoading(false);
            setIsProductLoading(false);
            setIsAmountLoading(false);
            return;
        }
        
        // Reset states on refetch
        setIsInvoiceLoading(true);
        setIsProductLoading(true);
        setIsAmountLoading(true);
        setInvoiceError(null);
        setProductError(null);
        setAmountError(null);
        setInvoiceDetails(null);
        setProductDetails(null);
        setAmountAndTaxDetails(null);


        const [invoiceResult, productResult, amountResult] = await Promise.allSettled([
            getInvoiceDetails(invoiceIdNum, addToast),
            getProductDetails(invoiceIdNum, addToast),
            getAmountAndTaxDetails(invoiceIdNum, addToast)
        ]);

        // Handle Invoice Details
        if (invoiceResult.status === 'fulfilled' && invoiceResult.value) {
            setInvoiceDetails(invoiceResult.value);
        } else {
            const reason = invoiceResult.status === 'rejected' ? invoiceResult.reason : { message: "Failed to fetch invoice details." };
            setInvoiceError(reason?.message || "An unknown error occurred.");
        }
        setIsInvoiceLoading(false);

        // Handle Product Details
        if (productResult.status === 'fulfilled' && productResult.value) {
            setProductDetails(productResult.value);
        } else {
            const reason = productResult.status === 'rejected' ? productResult.reason : { message: "Failed to fetch product details." };
            setProductError(reason?.message || "An unknown error occurred.");
        }
        setIsProductLoading(false);
        
        // Handle Amount and Tax Details
        if (amountResult.status === 'fulfilled' && amountResult.value) {
            setAmountAndTaxDetails(amountResult.value);
        } else {
            const reason = amountResult.status === 'rejected' ? amountResult.reason : { message: "Failed to fetch amount and tax details." };
            setAmountError(reason?.message || "An unknown error occurred.");
        }
        setIsAmountLoading(false);

    }, [invoiceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const isLoading = isInvoiceLoading || isProductLoading || isAmountLoading;

    if (isLoading) {
        return <Loader type="wifi" />;
    }

    // Render EditableComponent once loading is complete, passing data and errors
    return (
        <EditableComponent
            initialInvoiceDetails={invoiceDetails}
            initialProductDetails={productDetails}
            initialAmountAndTaxDetails={amountAndTaxDetails}
            invoiceError={invoiceError}
            productError={productError}
            amountError={amountError}
            onRetry={fetchData}
        />
    );
};

export default Edit;