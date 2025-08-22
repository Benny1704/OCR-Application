import { RefreshCw, Save, Eye } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RetryModal } from '../components/common/Helper';
import { DynamicField } from '../components/common/DynamicField';
import { formConfig } from '../components/config/formConfig';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import type { ExtractedData, ProductWithDetails, DataItem } from '../interfaces/Types';
import DataTable from '../components/common/DataTable';
import ProductDetailPopup from '../components/common/ProductDetailsPopup';

const ManualEntry = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [data, setData] = useState<ExtractedData>({} as ExtractedData);
    const [isRetryModalOpen, setRetryModalOpen] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    };
    const handleViewImage = () => window.open(data.invoice_image_url, '_blank', 'noopener,noreferrer');
    const openRetryModal = () => setRetryModalOpen(true);
    const handleSimpleRetry = () => { setRetryModalOpen(false); navigate('/loading'); };
    const handleRetryWithAlterations = () => { setRetryModalOpen(false); navigate('/imageAlteration'); };

    const isReadOnly = user?.role !== 'admin';

    const secondaryButtonClasses = `
    flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors
    border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500
    ${theme === 'dark'
            ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 ring-offset-[#1C1C2E]'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 ring-offset-gray-50'
        }`;

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);

    const renderActionCell = (row: DataItem) => {
        const productRow = row as ProductWithDetails;

        const handleOpenPopup = () => {
            // const fullProductData = mockProductData.find(p => p.id === productRow.id);
            // if (fullProductData) {
            //     setSelectedProduct(fullProductData);
            //     setIsPopupOpen(true);
            // }
        };

        return (
            <button
                onClick={handleOpenPopup}
                className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                title="View Details"
            >
                <Eye size={18} />
            </button>
        );
    };

    const mainTableData: any[] = [];

    return (
        <div className={`min-h-screen flex flex-col rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C2E] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
            <main className="flex-grow py-8 md:py-12">
                <div className="px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-gray-50' : 'text-gray-900'}`}>
                                Manual Data Entry
                            </h1>
                            <p className={`mt-2 text-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Please fill in the fields with the correct data from the invoice.
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={handleViewImage} className={secondaryButtonClasses}>
                                <Eye className="w-5 h-5" /> View Image
                            </button>
                            {user?.role === 'admin' && (
                                <button onClick={openRetryModal} className={secondaryButtonClasses}>
                                    <RefreshCw className="w-5 h-5" /> Retry
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {formConfig.map((section) => (
                            <div key={section.id} className={`rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className="p-6">
                                    <h2 className={`text-xl font-semibold pb-4 mb-6 border-b ${theme === 'dark' ? 'text-gray-50 border-slate-700' : 'text-gray-900 border-slate-200'}`}>
                                        {section.title}
                                    </h2>
                                    {section.id === 'product_details' ? (
                                        <div className="py-4">
                                            <DataTable
                                                tableData={mainTableData}
                                                isEditable={true}
                                                isSearchable={true}
                                                renderActionCell={renderActionCell}
                                                actionColumnHeader="Details"
                                                maxHeight="100%"
                                            />

                                            <ProductDetailPopup
                                                isOpen={isPopupOpen}
                                                onClose={() => setIsPopupOpen(false)}
                                                data={selectedProduct}
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {section.fields?.map((field) => (
                                                <DynamicField
                                                    key={field.key}
                                                    label={field.label}
                                                    name={field.key}
                                                    value={data[field.key] as string || ""}
                                                    onChange={handleInputChange}
                                                    readOnly={isReadOnly}
                                                    theme={theme}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className={`py-4 border-t backdrop-blur-sm ${theme === 'dark' ? 'bg-[#1C1C2E]/80 border-slate-700' : 'bg-gray-50/80 border-slate-200'}`}>
                <div className="px-4 sm:px-6 lg:px-8 flex justify-end">
                    <button
                        onClick={() => navigate('/preview')}
                        className={`flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 ${theme === 'dark' ? 'focus:ring-purple-800' : ''}`}
                    >
                        <Save className="w-5 h-5" /> Save and Preview
                    </button>
                </div>
            </footer>

            <RetryModal
                isOpen={isRetryModalOpen}
                onClose={() => setRetryModalOpen(false)}
                onRetry={handleSimpleRetry}
                onRetryWithAlterations={handleRetryWithAlterations}
            />
        </div>
    );
};

export default ManualEntry;