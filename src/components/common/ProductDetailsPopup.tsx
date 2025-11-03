import { useState, useEffect, useCallback } from 'react';
import type { LineItem, DataItem, ProductDetails } from '../../interfaces/Types';
import DataTable from './DataTable';
import { useTheme } from '../../hooks/useTheme';
import Loader from './Loader';
import { Save, AlertTriangle, Eye, CheckCircle, X } from 'lucide-react';
import { isEqual } from 'lodash';
import { ConfirmationModal, WarningConfirmationModal } from './Helper';
import { updateLineItems, getLineItems, manualInvoiceEntryItemAttributes } from '../../lib/api/Api';
import { useToast } from '../../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { popupVariants } from './Animation';

interface ProductDetailPopupProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductDetails | null;
    onSave: (isDirty: boolean) => void;
    onViewImage: () => void;
    itemAttributesConfig: any;
    invoiceId: number;
    isReadOnly?: boolean;
}

const ProductDetailPopup = ({ isOpen, onClose, product, onSave, onViewImage, itemAttributesConfig, invoiceId, isReadOnly = false }: ProductDetailPopupProps) => {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [initialLineItems, setInitialLineItems] = useState<LineItem[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [isUnsavedRowsModalOpen, setUnsavedRowsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [hasUnsavedRows, setHasUnsavedRows] = useState<boolean>(false);
    const [hasValidationErrors, setHasValidationErrors] = useState<boolean>(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // State for last update time

    const fetchLineItems = useCallback(async () => {
        if (product?.item_id && invoiceId) {
            setIsLoading(true);
            try {
                const fetchedLineItems = await getLineItems(invoiceId, product.item_id);
                const newInitialLineItems = fetchedLineItems.map((item: any) => ({ ...item }));
                setLineItems(newInitialLineItems);
                setInitialLineItems(newInitialLineItems);
                setIsDirty(false);
                setLastUpdated(new Date()); // Set update time on success
            } catch (error) {
                addToast({ type: 'error', message: 'Failed to fetch line items.' });
                setLastUpdated(null); // Clear update time on error
            } finally {
                setIsLoading(false);
            }
        } else {
            setLineItems([]);
            setInitialLineItems([]);
            setIsDirty(false);
        }
    }, [product, invoiceId]);

    const validateLineItems = useCallback((items: LineItem[]) => {
        const mandatoryFields = Array.isArray(itemAttributesConfig?.columns)
            ? itemAttributesConfig.columns
                .filter((field: any) => field.isRequired)
                .map((field: any) => field.key)
            : [];

        if (items.length === 0) return true;

        return items.every(item =>
            mandatoryFields.every((field: string) => {
                const value = item[field as keyof LineItem];
                return value !== null && value !== undefined && value !== '';
            })
        );
    }, [itemAttributesConfig]);

    const hasIncompleteMandatoryFields = useCallback((row: LineItem): boolean => {
        if (!itemAttributesConfig?.columns) return false;
        const requiredColumns = itemAttributesConfig.columns.filter((col: any) => col.isRequired && col.key !== 'sno');
        return requiredColumns.some((col: any) => {
            const value = row[col.key as keyof LineItem];
            return value === null || value === undefined || String(value).trim() === '';
        });
    }, [itemAttributesConfig]);

    useEffect(() => {
        if (isOpen) {
            fetchLineItems();
        }
    }, [isOpen, fetchLineItems]);

    useEffect(() => {
        const dirty = !isEqual(initialLineItems, lineItems);
        setIsDirty(dirty);
        if (dirty) {
            setIsFormValid(validateLineItems(lineItems));
        } else {
            setIsFormValid(true);
        }
    }, [lineItems, initialLineItems, validateLineItems]);

    const handleUnsavedRowsChange = useCallback((hasUnsaved: boolean) => {
        setHasUnsavedRows(hasUnsaved);
    }, []);

    const handleValidationChange = useCallback((hasErrors: boolean) => {
        setHasValidationErrors(hasErrors);
    }, []);

    const handleSave = async () => {
        if (isReadOnly) return;

        if (hasValidationErrors || !isFormValid) {
            addToast({ type: 'error', message: 'Please fix validation errors and fill all mandatory fields.' });
            return;
        }

        if (hasUnsavedRows) {
            setUnsavedRowsModalOpen(true);
            return;
        }

        if (!product?.item_id) {
            addToast({ type: 'error', message: 'Cannot save: Missing product item ID.' });
            return;
        }

        const savedLineItems = await updateLineItems(product.item_id, lineItems);
        if (savedLineItems) {
            onSave(isDirty);
            onClose();
        }
    };

    const handleClose = () => {
        if (isDirty && !isReadOnly) {
            setConfirmModalOpen(true);
        } else {
            onClose();
        }
    };

    const confirmClose = () => {
        setConfirmModalOpen(false);
        onClose();
    };

    const handleDataChange = (data: DataItem[]) => {
        setLineItems(data as LineItem[]);
    };

    const handleSaveRow = async (row: any) => {
        if (isReadOnly) return;

        if (hasIncompleteMandatoryFields(row)) {
            addToast({ type: 'error', message: 'Please fill all mandatory fields before saving.' });
            return;
        }

        if (!product?.item_id) {
            addToast({ type: 'error', message: 'Product ID is missing.' });
            return;
        }

        try {
            const attributePayload = {
                item_id: product.item_id,
                item_description: row.item_description || "",
                quantity: Number(row.quantity) || 0,
                pieces: Number(row.pieces) || 0,
                style_code: String(row.style_code) || "",
                brand: String(row.brand) || "",
                size: String(row.size) || "",
                pattern: String(row.pattern) || "",
                quality: String(row.quality) || "",
                cost_price: Number(row.cost_price) || 0,
                gst: String(row.gst) || "",
            };

            const response = await manualInvoiceEntryItemAttributes([attributePayload]);

            if (response && response.status === 'success') {
                addToast({ type: 'success', message: 'Row saved successfully!' });
                await fetchLineItems(); // Refresh data after saving
            }
        } catch (error) {
            console.error("Failed to save line item:", error);
            addToast({ type: 'error', message: 'Failed to save row.' });
        }
    };

    const renderActionCell = (row: DataItem) => {
        const lineItem = row as LineItem;
        const isSaved = typeof lineItem.attribute_id === 'number' && lineItem.attribute_id > 0;
        const hasIncompleteFields = hasIncompleteMandatoryFields(lineItem);

        return (
            <div className="text-center">
                {isSaved ? (
                    <CheckCircle size={20} className="text-emerald-500 mx-auto" />
                ) : (
                    <button
                        onClick={() => handleSaveRow(lineItem)}
                        className="p-1.5 rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                        title={hasIncompleteFields ? "Please fill all mandatory fields" : "Save Row"}
                        disabled={isReadOnly || hasIncompleteFields}
                    >
                        <Save size={16} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="product-details-content" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex justify-center items-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        variants={popupVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`w-full h-full max-h-[95vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ring-1
                            ${theme === "dark" ? "bg-slate-900 text-gray-200 ring-white/10" : "bg-white text-gray-900 ring-black/5"}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <header className={`flex-shrink-0 flex justify-between items-center p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                            <div>
                                <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    Line Item Details
                                </h2>
                                {/* <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {product?.item_description || 'No description'}
                                </p> */}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={onViewImage} className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-gray-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} font-medium py-2 px-3 rounded-lg text-sm transition-colors`}>
                                    <Eye size={14} /> View Image
                                </button>
                                <button
                                    onClick={handleClose}
                                    className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500
                                    ${theme === 'dark' ? 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'}`}
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </header>

                        <main className="flex-grow overflow-y-auto p-6">
                            {isLoading && !lastUpdated ? ( // Show loader only on initial load
                                <div className="flex justify-center items-center h-full"><Loader type="dots" /></div>
                            ) : (
                                <div className={`rounded-lg p-4 overflow-hidden ring-1 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/5'}`}>
                                    <DataTable
                                        tableData={lineItems}
                                        tableConfig={itemAttributesConfig}
                                        isEditable={!isReadOnly}
                                        isSearchable={true}
                                        pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25] }}
                                        maxHeight="100%"
                                        onDataChange={handleDataChange}
                                        onValidationChange={handleValidationChange}
                                        onUnsavedRowsChange={handleUnsavedRowsChange}
                                        renderActionCell={renderActionCell}
                                        actionColumnHeader="Status"
                                        isRefreshable={!isReadOnly}
                                        isRefreshing={isLoading}
                                        lastUpdatedDate={lastUpdated}
                                        onRefresh={fetchLineItems}
                                    />
                                </div>
                            )}
                        </main>

                        {!isReadOnly && (
                            <footer className={`flex-shrink-0 flex justify-end items-center p-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-2 px-5 rounded-lg text-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isReadOnly || !isDirty || !isFormValid || hasValidationErrors}
                                >
                                    <Save size={14} /> Save Changes
                                </button>
                            </footer>
                        )}
                    </motion.div>
                </motion.div>
            )}

            <ConfirmationModal
                key="unsaved-changes-modal"
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmClose}
                title="Unsaved Changes"
                message="You have unsaved changes. Are you sure you want to close?"
                icon={<AlertTriangle className="text-yellow-500" size={24} />}
            />

            <WarningConfirmationModal
                key="unsaved-rows-warning-modal"
                isOpen={isUnsavedRowsModalOpen}
                onClose={() => setUnsavedRowsModalOpen(false)}
                onConfirm={() => setUnsavedRowsModalOpen(false)}
                title="Unsaved Rows in Line Items"
                message="You have unsaved rows in the line items table. Please save all rows before saving changes."
                icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />}
                showConfirmButton={false}
            />
        </AnimatePresence>
    );
};

export default ProductDetailPopup;