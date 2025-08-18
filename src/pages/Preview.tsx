import { CheckCircle2 } from "lucide-react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import type { ExtractedData } from "../interfaces/Types";
import { mockExtractedData } from "../lib/MockData";

const Preview = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
    const { user } = useAuth();
    const data: ExtractedData = mockExtractedData;

    const DisplaySection: FC<{ title: string; data: object }> = ({ title, data }) => (
        <div className={`p-8 rounded-2xl shadow-lg border mb-8 overflow-hidden transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`}>
            <h3 className={`font-bold text-xl border-b pb-4 mb-4 transition-colors ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-800 border-gray-200'}`}>{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key}>
                        <span className={`text-sm font-medium capitalize block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{key.replace(/_/g, ' ')}</span>
                        <span className={`font-semibold text-lg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{value.toString() || '-'}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
            <div className="text-center">
                <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Final Preview</h2>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2 text-lg`}>Please confirm the extracted data before final submission.</p>
            </div>
            <DisplaySection title="Invoice Details" data={data.invoice} />
            <DisplaySection title="Supplier Details" data={data.supplier} />
            <DisplaySection title="Amount Details" data={data.amount} />
            <div className={`p-6 rounded-2xl shadow-lg border ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`}>
                <h3 className={`font-bold text-xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Product Details</h3>
                {data.product_details.items.slice(0, 3).map((item, index) => (
                    <div key={index} className={`border rounded-lg overflow-hidden mb-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <table className="min-w-full text-sm">
                            <thead className={theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'}><tr className="text-left"><th className={`p-3 font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>S.No</th><th className={`p-3 font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Description</th><th className={`p-3 font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>HSN</th><th className={`p-3 font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tax Amount</th></tr></thead>
                            <tbody className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}><tr className="text-gray-800 dark:text-gray-300"><td className="p-3">{item.s_no}</td><td className="p-3">{item.description}</td><td className="p-3">{item.size.HSN}</td><td className="p-3">{item.size.tax_amount}</td></tr></tbody>
                        </table>
                        <div className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Size Details</h4>
                            <div className={`overflow-x-auto rounded-md border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                <table className={`min-w-full text-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                                    <thead className={theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-200'}><tr className="text-left">{['Size', 'Pieces', 'Quantity', 'Rate', 'MRP Rate'].map(h => <th key={h} className={`p-2 font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{h}</th>)}</tr></thead>
                                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                        {item.size.size.slice(0, 5).map((_, sizeIndex) => (
                                            <tr key={sizeIndex} className='text-gray-800 dark:text-gray-300'><td className="p-2">{item.size.size[sizeIndex] || '-'}</td><td className="p-2">{item.size.pieces[sizeIndex] || '-'}</td><td className="p-2">{item.size.quantity[sizeIndex] || '-'}</td><td className="p-2">{item.size.rate[sizeIndex] || '-'}</td><td className="p-2">{item.size.MRP_rate[sizeIndex] || '-'}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 flex justify-end space-x-4">
                <button onClick={() => navigate('/edit')} className={`font-bold py-3 px-6 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>Back to Edit</button>
                <button onClick={() => { alert('Data submitted successfully!'); navigate(user?.role === 'admin' ? '/dashboard' : '/queue'); }} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                    <CheckCircle2 className="w-5 h-5"/> Confirm & Submit
                </button>
            </div>
        </div>
    );
}

export default Preview
