import { useEffect, useState, useCallback } from 'react';
import EditableComponent from '../components/common/EditableComponent';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';
import { useToast } from '../hooks/useToast';
import { getInvoiceConfig, getInvoiceMetaConfig, getItemSummaryConfig, getItemAttributesConfig } from '../lib/api/Api';
import type { FormSection, FormField } from '../interfaces/Types';

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
            setError(err.message || "An unknown error occurred while fetching the form configuration.");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

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
                messageId=""
                formConfig={formConfig}
                itemSummaryConfig={itemSummaryConfig}
                itemAttributesConfig={itemAttributesConfig}
            />
        );
    }

    return <div className="p-4"><ErrorDisplay message="Could not display the manual entry form." onRetry={fetchConfig} /></div>;
};

export default ManualEntry;