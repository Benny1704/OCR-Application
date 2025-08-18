import { RefreshCw, Save } from 'lucide-react';
import { useState, type FC } from 'react'
import { useNavigate } from 'react-router';
import { RetryModal, AccordionItem, InputField, ProductDetailsTable } from '../components/common/Helper';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import type { ExtractedData, ProductItem } from '../interfaces/Types';
import { mockExtractedData } from '../lib/MockData';
import DataTable from '../components/common/DataTable';

const Edit = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState<ExtractedData>(mockExtractedData);
    const [isRetryModalOpen, setRetryModalOpen] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string>('supplier_invoice');

    const handleSectionChange = (section: keyof Omit<ExtractedData, 'product_details' | 'billing'>, name: string, value: string) => { 
        setData(prev => ({ ...prev, [section]: { ...(prev[section] as object), [name]: value } })); 
    };
    const handleProductItemsChange = (newItems: ProductItem[]) => { setData(prev => ({ ...prev, product_details: { ...prev.product_details, items: newItems } })); };

    const openRetryModal = () => setRetryModalOpen(true);
    const handleSimpleRetry = () => { setRetryModalOpen(false); navigate('/loading'); };
    const handleRetryWithAlterations = () => { setRetryModalOpen(false); navigate('/imageAlteration'); };
    
    const isReadOnly = user?.role !== 'admin';

    const toggleAccordion = (key: string) => {
        setOpenAccordion(openAccordion === key ? '' : key);
    };
    
    const SectionSubheader: FC<{ title: string }> = ({ title }) => (
        <h4 className={`col-span-1 md:col-span-2 lg:col-span-3 font-semibold mt-4 mb-1 text-base ${theme === 'dark' ? 'text-violet-400' : 'text-violet-700'}`}>{title}</h4>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
            <RetryModal isOpen={isRetryModalOpen} onClose={() => setRetryModalOpen(false)} onRetry={handleSimpleRetry} onRetryWithAlterations={handleRetryWithAlterations} />
            <div className="flex justify-between items-center">
                <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Verify & Edit Extracted Data</h2>
                {user?.role === 'admin' && (
                    <button onClick={openRetryModal} className={`flex items-center gap-2 font-bold py-2 px-4 rounded-lg transition-colors border shadow-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'}`}>
                        <RefreshCw className="w-5 h-5"/> Retry Processing
                    </button>
                )}
            </div>
            
            <div className="space-y-4">
                 <AccordionItem
                    key="supplier_invoice"
                    title="Supplier & Invoice Details"
                    isOpen={openAccordion === 'supplier_invoice'}
                    onClick={() => toggleAccordion('supplier_invoice')}
                >
                    <SectionSubheader title="Invoice Information" />
                    {Object.entries(data.invoice).map(([field, value]) => (
                        <InputField key={`invoice-${field}`} label={field} name={field} value={value as string} onChange={(e) => handleSectionChange('invoice', e.target.name, e.target.value)} readOnly={isReadOnly} />
                    ))}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t my-4 dark:border-gray-700 border-gray-200"></div>
                    <SectionSubheader title="Supplier Information" />
                     {Object.entries(data.supplier).map(([field, value]) => (
                        <InputField key={`supplier-${field}`} label={field} name={field} value={value as string} onChange={(e) => handleSectionChange('supplier', e.target.name, e.target.value)} readOnly={isReadOnly} />
                    ))}
                </AccordionItem>

                <AccordionItem
                    key="product_details"
                    title="Product Details"
                    isOpen={openAccordion === 'product_details'}
                    onClick={() => toggleAccordion('product_details')}
                    isTable
                >
                  {/* <DataTable tableData={JSON.parse(JSON.stringify(data.product_details.items))}/> */}
                    <ProductDetailsTable initialItems={data.product_details.items} onItemsChange={handleProductItemsChange} isReadOnly={isReadOnly} />
                </AccordionItem>

                <AccordionItem
                    key="gst_amount"
                    title="GST & Amount Details"
                    isOpen={openAccordion === 'gst_amount'}
                    onClick={() => toggleAccordion('gst_amount')}
                >
                    <SectionSubheader title="Tax Details" />
                    {Object.entries(data.taxes).map(([field, value]) => (
                        <InputField key={`taxes-${field}`} label={field} name={field} value={value as string} onChange={(e) => handleSectionChange('taxes', e.target.name, e.target.value)} readOnly={isReadOnly} />
                    ))}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t my-4 dark:border-gray-700 border-gray-200"></div>
                    <SectionSubheader title="Charges & Discounts" />
                    {Object.entries(data.discount).map(([field, value]) => (
                        <InputField key={`discount-${field}`} label={field} name={field} value={value as string} onChange={(e) => handleSectionChange('discount', e.target.name, e.target.value)} readOnly={isReadOnly} />
                    ))}
                     {Object.entries(data.charges).map(([field, value]) => (
                        <InputField key={`charges-${field}`} label={field} name={field} value={value as string} onChange={(e) => handleSectionChange('charges', e.target.name, e.target.value)} readOnly={isReadOnly} />
                    ))}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t my-4 dark:border-gray-700 border-gray-200"></div>
                    <SectionSubheader title="Final Amount" />
                    {Object.entries(data.amount).map(([field, value]) => (
                        <InputField key={`amount-${field}`} label={field} name={field} value={value as string} onChange={(e) => handleSectionChange('amount', e.target.name, e.target.value)} readOnly={isReadOnly} />
                    ))}
                </AccordionItem>
            </div>
            
            <div className="mt-8 flex justify-end">
                <button onClick={() => navigate('/preview')} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                    <Save className="w-5 h-5"/> Save and Preview
                </button>
            </div>
        </div>
    );
}

export default Edit
