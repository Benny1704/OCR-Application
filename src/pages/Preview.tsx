import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building, CheckCircle2, DollarSign, FileText, Package, Truck, X, Eye, Loader2
} from "lucide-react";
import type { AmountAndTaxDetails, InvoiceDetails, ProductDetails } from "../interfaces/Types";
import { updateInvoiceDetails, updateProductDetails, updateAmountAndTaxDetails, updateLineItems } from "../lib/api/Api";
import DataTable from "../components/common/DataTable";

// --- Helper Component to display a single key-value pair ---
const DetailItem = ({ label, value }: { label: string, value: any }) => {
    const { theme } = useTheme();
    return (
        <div>
            <span className={`text-xs font-medium capitalize block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{label.replace(/_/g, ' ')}</span>
            <span className={`font-semibold text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{value?.toString() || '-'}</span>
        </div>
    );
};

// --- Info Card Component ---
const InfoCard = ({ title, data, icon: Icon }: { title: string; data: Record<string, any>; icon: React.ElementType }) => {
    const { theme } = useTheme();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-2xl shadow-lg border p-5 overflow-hidden ${theme === 'dark' ? 'border-gray-700 bg-[#1C1C2E]' : 'border-gray-200/80 bg-white'}`}
        >
            <h3 className={`flex items-center font-bold text-lg pb-4 mb-4 border-b ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-800 border-gray-200'}`}>
                <Icon className="w-5 h-5 mr-3 text-violet-500" /> {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {Object.entries(data).map(([key, value]) => (
                    <DetailItem key={key} label={key} value={value} />
                ))}
            </div>
        </motion.div>
    );
};

// --- Line Items Popup ---
const LineItemPopup = ({ product, onClose }: { product: ProductDetails | null, onClose: () => void }) => {
    const { theme } = useTheme();
    if (!product) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-[#1C1C2E] border-slate-700' : 'bg-white border-slate-200'}`}
            >
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold dark:text-white">Line Items for: <span className="text-violet-400">{product.item_description}</span></h3>
                    <button onClick={onClose} className="p-2 rounded-full dark:hover:bg-slate-700 hover:bg-slate-200 transition-colors"><X size={18} /></button>
                </header>
                <div className="p-4 flex-grow overflow-y-auto">
                    <DataTable tableData={product.line_items || []} isEditable={false} isSearchable={true} />
                </div>
            </motion.div>
        </div>
    );
};

// --- Success Message Box ---
const MessageBox = ({ message, onClose }: { message: string; onClose: () => void; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center transform transition-all animate-fade-in-up bg-white dark:bg-[#2a2a3e] border border-gray-200 dark:border-gray-700">
            <div className="flex justify-center mb-4"><CheckCircle2 className="w-16 h-16 text-emerald-500" /></div>
            <p className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">{message}</p>
            <button onClick={onClose} className="w-full font-bold py-2 px-4 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">Close</button>
        </div>
    </div>
);


// --- Product List Item Component ---
const ProductListItem = ({ product, index, onViewLineItems }: { product: ProductDetails, index: number, onViewLineItems: (p: ProductDetails) => void }) => {
    const { theme } = useTheme();
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className={`p-4 rounded-xl border transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}
        >
            <div className="flex justify-between items-start mb-3">
                <p className="font-bold text-sm dark:text-gray-200 max-w-[70%]">{product.item_description}</p>
                <span className="text-sm font-mono font-semibold text-violet-500 dark:text-violet-400">{product.total_amount.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400 border-t dark:border-slate-700 pt-3">
                <DetailItem label="Item ID" value={product.id} />
                <DetailItem label="Category" value={product.category} />
                <DetailItem label="HSN" value={product.HSN} />
                <DetailItem label="Quantity" value={`${product.total_quantity} ${product.UOM}`} />
            </div>
            {product.line_items && product.line_items.length > 0 && (
                <div className="mt-3 border-t dark:border-slate-700 pt-3">
                    <button onClick={() => onViewLineItems(product)} className="w-full text-xs flex items-center justify-center gap-2 font-semibold text-violet-500 hover:text-violet-400">
                        <Eye size={14} /> View {product.line_items.length} Line Items
                    </button>
                </div>
            )}
        </motion.div>
    );
};

// --- MAIN PREVIEW COMPONENT ---
const Preview = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    const { invoiceId } = useParams<{ invoiceId: string }>();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);

    const data = location.state as {
        invoiceDetails: InvoiceDetails;
        productDetails: ProductDetails[];
        amountAndTaxDetails: AmountAndTaxDetails;
    };

    if (!data?.invoiceDetails || !data?.productDetails || !data?.amountAndTaxDetails) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                <h2 className="text-2xl font-bold text-red-500">Error: Missing Data</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    No data was provided for preview. Please return to the edit page.
                </p>
                <button
                    onClick={() => navigate(invoiceId ? `/edit/${invoiceId}` : '/documents')}
                    className="mt-6 font-bold py-2 px-4 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const { invoiceDetails, productDetails, amountAndTaxDetails } = data;
    
    const handleSubmit = async () => {
        if (!invoiceId) {
            addToast({ message: "Invoice ID is missing.", type: "error" });
            return;
        }
        setIsSubmitting(true);
        try {
            const invoiceIdNum = parseInt(invoiceId, 10);
            
            // Create a list of all promises
            const promises = [];

            // 1. Update main invoice details
            promises.push(updateInvoiceDetails(invoiceIdNum, invoiceDetails));

            // 2. Update product summary details
            promises.push(updateProductDetails(invoiceIdNum, productDetails));
            
            // 3. Update amount and tax details
            promises.push(updateAmountAndTaxDetails(invoiceIdNum, amountAndTaxDetails));

            // 4. Update line items for each product that has them
            productDetails.forEach(p => {
                if (p.line_items && p.line_items.length > 0) {
                    const productId = typeof p.id === 'string' ? parseInt(p.id, 10) : p.id;
                    if (!isNaN(productId)) {
                        promises.push(updateLineItems(productId, p.line_items));
                    }
                }
            });

            await Promise.all(promises);

            setShowSuccess(true);
        } catch (error) {
            // Error toast is already shown by the API handler
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccess(false);
        navigate('/document');
    };

    const supplierData = {
        supplier_id: invoiceDetails.supplier_id,
        supplier_name: invoiceDetails.supplier_name,
        supplier_address: invoiceDetails.supplier_address,
        supplier_gst: invoiceDetails.supplier_gst,
    };
    const invoiceData = {
        invoice_id: invoiceDetails.invoice_id,
        invoice_number: invoiceDetails.invoice_number,
        invoice_date: invoiceDetails.invoice_date,
        irn: invoiceDetails.irn,
    };
    const logisticsData = {
        order_number: invoiceDetails.order_number,
        order_date: invoiceDetails.order_date,
        way_bill: invoiceDetails.way_bill,
        acknowledgement_number: invoiceDetails.acknowledgement_number,
        acknowledgement_date: invoiceDetails.acknowledgement_date,
    };

    return (
        <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-[#121212] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className={`text-3xl md:text-4xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Review Your Submission</h2>
                        <p className="mt-3 text-base text-gray-500 dark:text-gray-400">Please confirm all details below before final submission.</p>
                    </div>
                </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    <div className="lg:col-span-3 space-y-8">
                        <InfoCard title="Supplier Details" icon={Building} data={supplierData} />
                        <InfoCard title="Invoice Core Details" icon={FileText} data={invoiceData} />
                        <InfoCard title="Order & Logistics" icon={Truck} data={logisticsData} />
                        <InfoCard title="Amount & Tax Summary" icon={DollarSign} data={amountAndTaxDetails} />
                    </div>
                    <div className="lg:col-span-2">
                         <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={`rounded-2xl shadow-lg border p-5 space-y-4 h-full ${theme === 'dark' ? 'border-gray-700 bg-[#1C1C2E]' : 'border-gray-200/80 bg-white'}`}
                        >
                            <h3 className={`flex items-center font-bold text-lg pb-4 border-b ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-800 border-gray-200'}`}>
                                <Package className="w-5 h-5 mr-3 text-violet-500" /> Product Line Items
                            </h3>
                            <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
                                {productDetails.map((product, index) => (
                                    <ProductListItem key={product.id} product={product} index={index} onViewLineItems={setSelectedProduct} />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-10 pt-6 border-t dark:border-gray-700/60 flex flex-col sm:flex-row justify-end gap-4"
                >
                    <button
                        onClick={() => navigate(`/edit/${invoiceId}`)}
                        className="w-full sm:w-auto font-bold py-3 px-6 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                        disabled={isSubmitting}
                    >
                        Back to Edit
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                </motion.div>
            </main>

            <AnimatePresence>
                {selectedProduct && <LineItemPopup product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
                {showSuccess && <MessageBox message="Data submitted successfully!" onClose={handleCloseSuccess} />}
            </AnimatePresence>
        </div>
    );
};

export default Preview;