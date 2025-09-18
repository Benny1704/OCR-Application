import { useEffect, useState, useCallback } from 'react';
import EditableComponent from '../components/common/EditableComponent';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';
import { useToast } from '../hooks/useToast';
import { getInvoiceConfig, getInvoiceMetaConfig, getItemSummaryConfig, getItemAttributesConfig } from '../lib/api/Api';
import type { FormSection, FormField, ProductDetails } from '../interfaces/Types';

const ManualEntry = () => {
    const [formConfig, setFormConfig] = useState<FormSection[] | null>(null);
    const [itemSummaryConfig, setItemSummaryConfig] = useState<{ columns: FormField[] } | null>(null);
    const [itemAttributesConfig, setItemAttributesConfig] = useState<{ columns: FormField[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();

    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [
                invoiceConfigData,
                invoiceMetaConfigData,
                itemSummaryConfigData,
                itemAttributesConfigData,
            ] = await Promise.all([
                getInvoiceConfig(addToast),
                getInvoiceMetaConfig(addToast),
                getItemSummaryConfig(addToast),
                getItemAttributesConfig(addToast),
            ]);

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
            setError(err.message || "An unknown error occurred while fetching the form configuration.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // --- NEW FUNCTION ---
    // For manual entry, we can't save a single product row to the backend
    // because there's no invoice_id yet. This function simulates the save
    // by adding a temporary local item_id, allowing the UI to switch
    // from "Save" to "View Details".
    const handleSaveNewProductLocally = async (product: ProductDetails): Promise<ProductDetails> => {
        addToast({ type: 'success', message: 'Product row staged for saving.' });
        return {
            ...product,
            item_id: `local-${Date.now()}` // Assign a temporary local ID
        };
    };


    if (isLoading) {
        return <Loader type="wifi" />;
    }

    if (error) {
        return <div className="p-4"><ErrorDisplay message={error} onRetry={fetchConfig} /></div>;
    }

    if (formConfig && itemSummaryConfig && itemAttributesConfig) {
        return (
            <EditableComponent
                isManual={true}
                messageId="" // No messageId for a new manual entry
                formConfig={formConfig}
                itemSummaryConfig={itemSummaryConfig}
                itemAttributesConfig={itemAttributesConfig}
                // --- PASSING THE NEW LOCAL SAVE FUNCTION ---
                onSaveNewProduct={handleSaveNewProductLocally}
            />
        );
    }

    return <div className="p-4"><ErrorDisplay message="Could not display the manual entry form." onRetry={fetchConfig} /></div>;
};

export default ManualEntry;