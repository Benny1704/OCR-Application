import { CheckCircle2, Eye, X, Building, DollarSign, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { mockExtractedData, mockProductData } from "../lib/MockData";

// --- INTERFACES ---
interface ChildProduct { id: string; s_no: number; product_code: string; product_description: string; pieces: number; style_code: string; hsn_code: string; counter: string; type: string; brand: string; }
interface Summary { total_pcs: number; entered_pcs: number; total_qty: number; entered_qty: number; }
interface ProductWithDetails { id: string; s_no: number; product_group: string; uom: string; qty: number; pcs: number; cost_price: number; discount_amount: number; discount_percent: string; price_code: string; supplier_description: string; mrp: number; hsn_code: string; igst: string; rounded_off: number; total: number; by_no: string; gst_rate: string; po_no: string; child_products: ChildProduct[]; summary: Summary; }

// --- UI COMPONENTS ---
const MessageBox = ({ message, onClose }: { message: string; onClose: () => void; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center transform transition-all animate-fade-in-up bg-white dark:bg-[#2a2a3e] border border-gray-200 dark:border-gray-700">
            <div className="flex justify-center mb-4"><CheckCircle2 className="w-16 h-16 text-emerald-500" /></div>
            <p className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">{message}</p>
            <button onClick={onClose} className="w-full font-bold py-2 px-4 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">Close</button>
        </div>
    </div>
);

const ProductDetailsModal = ({ product, onClose }: { product: ProductWithDetails | null; onClose: () => void; }) => {
    if (!product) return null;
    const summaryItems = [
        { label: 'Total Pieces', value: product.summary.total_pcs, isMismatch: product.summary.total_pcs !== product.summary.entered_pcs },
        { label: 'Entered Pieces', value: product.summary.entered_pcs, isMismatch: product.summary.total_pcs !== product.summary.entered_pcs },
        { label: 'Total Quantity', value: product.summary.total_qty, isMismatch: product.summary.total_qty !== product.summary.entered_qty },
        { label: 'Entered Quantity', value: product.summary.entered_qty, isMismatch: product.summary.total_qty !== product.summary.entered_qty },
    ];
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl transform transition-all animate-fade-in-up bg-gray-50 dark:bg-[#1C1C2E] border border-gray-200 dark:border-gray-700">
                <div className="sticky top-0 p-5 flex justify-between items-center z-10 bg-inherit rounded-t-2xl border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Details for {product.id}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Discrepancy Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            {summaryItems.map(item => (
                                <div key={item.label} className={`p-3 rounded-md ${item.isMismatch ? 'bg-red-100 dark:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/50'}`}>
                                    <span className="text-sm block text-gray-600 dark:text-gray-400">{item.label}</span>
                                    <span className={`text-lg font-bold ${item.isMismatch ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Child Products</h4>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full text-sm bg-white dark:bg-gray-800/50">
                                <thead className="bg-gray-100 dark:bg-gray-900/50">
                                    <tr className="text-left">
                                        {['S.No', 'Product Code', 'Description', 'Pieces', 'Brand'].map(h => <th key={h} className="p-3 font-semibold text-gray-600 dark:text-gray-300">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {product.child_products.map(child => (
                                        <tr key={child.id} className="text-gray-700 dark:text-gray-400">
                                            <td className="p-3">{child.s_no}</td>
                                            <td className="p-3">{child.product_code}</td>
                                            <td className="p-3">{child.product_description}</td>
                                            <td className="p-3">{child.pieces}</td>
                                            <td className="p-3">{child.brand}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoCard = ({ title, data, icon: Icon, theme }: { title: string; data: object; icon: React.ElementType; theme: any }) => (
    <div className={`p-4 md:p-5 rounded-2xl shadow-lg border mb-6 md:mb-8 overflow-hidden transition-colors ${theme === 'dark' ? 'border-gray-700 bg-[#1C1C2E]' : 'border-gray-200/80 bg-white'}`}>
        <h3 className={`flex items-center font-bold text-md md:text-lg pb-3 md:pb-4 mb-3 md:mb-4 border-b ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-800 border-gray-200'}`}>
            <Icon className="w-5 h-5 mr-3 text-blue-500" /> {title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                    <span className={`text-xs font-medium capitalize block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{key.replace(/_/g, ' ')}</span>
                    <span className={`font-semibold text-sm md:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{value.toString() || '-'}</span>
                </div>
            ))}
        </div>
    </div>
);

// --- MAIN PREVIEW COMPONENT ---
const Preview = () => {
    const { theme } = useTheme(); 
    const navigate = useNavigate();
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);

    const supplierAndInvoiceDetails = { supplier_name_email: mockExtractedData.supplier_name_email, gstin_no: mockExtractedData.gstin_no, invoice_no: mockExtractedData.invoice_no, invoice_date: mockExtractedData.invoice_date, po_no: mockExtractedData.po_no, merchandise_name: mockExtractedData.merchandise_name, };
    const amountAndTaxDetails = { product_total: mockExtractedData.product_total, taxable_value: mockExtractedData.taxable_value, discount: mockExtractedData.discount, igst: mockExtractedData.igst, tcs_amount: mockExtractedData.tcs_amount, total_amount: mockExtractedData.total_amount, };

    const handleSubmit = () => { console.log("Submitting data..."); setShowSuccessMessage(true); };
    const handleCloseMessage = () => { setShowSuccessMessage(false); navigate('/documents'); }

    return (
        <div className={`min-h-screen font-sans rounded-[30px] ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`}>
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-8 md:mb-10">
                    <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black-200'}`}>Invoice & Product Verification</h2>
                    <p className="mt-2 text-sm md:text-base text-gray-500 dark:text-gray-400">Review the details below.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                    <div className="lg:col-span-1 space-y-6 md:space-y-8">
                        <div className={`p-4 md:p-5 rounded-2xl shadow-lg border ${theme === 'dark' ? 'border-gray-700 bg-[#1C1C2E]' : 'border-gray-200/80 bg-white'}`}>
                            <h3 className={`flex items-center font-bold text-md md:text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                <FileText className="w-5 h-5 mr-3 text-blue-500" /> Invoice Document
                            </h3>
                            <div className="rounded-lg overflow-hidden border border-gray-200">
                                <img src={mockExtractedData.invoice_image_url} alt="Invoice" className="object-cover object-top w-full h-full" />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        <InfoCard title="Supplier & Invoice Details" data={supplierAndInvoiceDetails} icon={Building} theme={theme} />
                        <InfoCard title="Amount & Tax Details" data={amountAndTaxDetails} icon={DollarSign} theme={theme} />
                    </div>
                </div>

                <div className={`mt-6 md:mt-8 rounded-2xl overflow-hidden shadow-lg border ${theme === 'dark' ? 'border-gray-700 bg-[#1C1C2E]' : 'border-gray-200/80 bg-white'}`}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className={`p-4 font-semibold ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                                <tr className="text-left">
                                    {['#', 'Product Group', 'Description', 'Qty', 'Total', 'Actions'].map(h => <th key={h} className={`p-3 md:p-4 font-semibold text-xs md:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {mockProductData.map((product) => (
                                    <tr key={product.id} className={`border-t text-xs md:text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800/50 border-gray-700/60' : 'text-gray-800 bg-gray-50 border-gray-200/80'}`}>
                                        <td className="p-3 md:p-4">{product.s_no}</td>
                                        <td className="p-3 md:p-4 font-medium">{product.product_group}</td>
                                        <td className="p-3 md:p-4 ">{product.supplier_description}</td>
                                        <td className="p-3 md:p-4">{product.qty} {product.uom}</td>
                                        <td className="p-3 md:p-4 font-semibold">{product.total.toFixed(2)}</td>
                                        <td className="p-3 md:p-4">
                                            <button onClick={() => setSelectedProduct(product)} className="flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                                <Eye className="w-4 h-4" /> View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 md:mt-10 pt-6 border-t border-gray-200/80 dark:border-gray-700/60 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
                    <button onClick={() => navigate('/edit')} className="w-full sm:w-auto font-bold py-3 px-6 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">Back to Edit</button>
                    <button onClick={handleSubmit} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                        <CheckCircle2 className="w-5 h-5"/> Confirm & Submit
                    </button>
                </div>
            </main>

            {showSuccessMessage && <MessageBox message="Data submitted successfully!" onClose={handleCloseMessage} />}
            <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        </div>
    );
}

export default Preview;