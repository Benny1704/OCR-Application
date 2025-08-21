import { RefreshCw, ChevronLeft, ChevronRight, Eye, ZoomOut, RotateCcw, ZoomIn, ChevronDown } from 'lucide-react';
import { useState, useEffect, type ChangeEvent, type ReactNode } from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { InfoPillProps, PopupProps, ProductItem, Document } from '../../interfaces/Types';

// --- Helper Components ---

export const Popup = ({ isOpen, onClose, data }: PopupProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Item Details</h2>
        <div className="space-y-2">
          {data && Object.entries(data).map(([key, value]) => (
            <p key={key} className="text-gray-700">
              <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}: </span>
              {value.toString()}
            </p>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
          Close
        </button>
      </div>
    </div>
  );
};

export const JsonPreviewModal = ({ isOpen, onClose, data }: PopupProps) => {
     if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-gray-100">Current JSON Data</h2>
                <div className="overflow-auto bg-gray-800 p-4 rounded-md flex-grow">
                    <pre><code>{JSON.stringify(data, null, 2)}</code></pre>
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                    Close Preview
                </button>
            </div>
        </div>
    );
};

export const InfoPill = ({ children }: InfoPillProps) => (
    <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
        {children}
    </span>
);

export const HowToUse = () => (
    <div className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-20">
        <h4 className="font-bold mb-2 text-base">How to Use</h4>
        <ul className="list-disc list-inside space-y-1">
            <li><b>Edit Cell:</b> Double-click a cell. Use <kbd className="font-mono bg-gray-600 px-1 rounded">Enter</kbd>, <kbd className="font-mono bg-gray-600 px-1 rounded">Tab</kbd>, or <kbd className="font-mono bg-gray-600 px-1 rounded">Arrows</kbd> to save and navigate. <kbd className="font-mono bg-gray-600 px-1 rounded">Esc</kbd> to cancel.</li>
            <li><b>Select:</b> Click a cell. <kbd className="font-mono bg-gray-600 px-1 rounded">Ctrl+Click</kbd> or <kbd className="font-mono bg-gray-600 px-1 rounded">Ctrl+Arrows</kbd> for multi-select.</li>
            <li><b>Shift Cells:</b> Select, then use <kbd className="font-mono bg-gray-600 px-1 rounded">Shift+Arrows</kbd>.</li>
            <li><b>Shift Group:</b> Select, then use <kbd className="font-mono bg-gray-600 px-1 rounded">Alt+Arrows</kbd> to move the whole column/row.</li>
            <li><b>Swap:</b> Drag & drop cells, or use <kbd className="font-mono bg-gray-600 px-1 rounded">Ctrl+C</kbd> / <kbd className="font-mono bg-gray-600 px-1 rounded">Ctrl+V</kbd>.</li>
            <li><b>Undo/Redo:</b> <kbd className="font-mono bg-gray-600 px-1 rounded">Ctrl+Z</kbd> / <kbd className="font-mono bg-gray-600 px-1 rounded">Ctrl+Y</kbd>.</li>
        </ul>
    </div>
);


export const RetryModal = ({ isOpen, onClose, onRetry, onRetryWithAlterations }: { isOpen: boolean; onClose: () => void; onRetry: () => void; onRetryWithAlterations: () => void; }) => { if (!isOpen) return null; return ( <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in" onClick={onClose}> <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-transform duration-300 animate-scale-in" onClick={e => e.stopPropagation()}> <h3 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-2">Retry Processing</h3> <p className="text-gray-500 dark:text-gray-400 text-center mb-8">Choose how you would like to re-process this document.</p> <div className="space-y-4"> <button onClick={onRetry} className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-violet-500/50"> <RefreshCw className="w-5 h-5"/> Just Retry </button> <button onClick={onRetryWithAlterations} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-3 px-6 rounded-lg transition-colors transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-500/50"> Retry with Image Alterations </button> </div> </div> </div> ); };
export const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; }) => { if (totalPages <= 1) return null; return ( <div className="flex items-center justify-end gap-2 p-2 text-gray-600 dark:text-gray-400"> <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-100 dark:hover:bg-violet-900/50 hover:text-violet-600 dark:hover:text-violet-300 transition-colors duration-200"> <ChevronLeft className="w-5 h-5"/> </button> <span className="text-sm font-semibold"> Page {currentPage} of {totalPages} </span> <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-100 dark:hover:bg-violet-900/50 hover:text-violet-600 dark:hover:text-violet-300 transition-colors duration-200"> <ChevronRight className="w-5 h-5"/> </button> </div> ); };
export const SizeDetailsModal = ({ isOpen, onClose, item }:{ isOpen: boolean; onClose: () => void; item: ProductItem | null }) => { if (!isOpen || !item) return null; const sizeDetailRows = [ { label: 'Pieces', data: item.size.pieces }, { label: 'Quantity', data: item.size.quantity }, { label: 'Rate', data: item.size.rate }, { label: 'MRP Rate', data: item.size.MRP_rate }, ]; return ( <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in" onClick={onClose}> <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col transform transition-transform duration-300 animate-scale-in" onClick={e => e.stopPropagation()}> <header className="px-8 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-2xl flex justify-between items-center flex-shrink-0"> <h3 className="text-xl font-bold text-gray-800 dark:text-white">Size Details: <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">{item.design_code || 'N/A'}</span></h3> <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-3xl font-light transition-colors" title="Close">&times;</button> </header> <main className="p-8 overflow-y-auto space-y-6 bg-white dark:bg-gray-900"> <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4"> <div className="flex flex-col"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">S.No</span> <span className="text-gray-900 dark:text-white font-semibold">{item.s_no}</span></div> <div className="flex flex-col"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</span> <span className="text-gray-900 dark:text-white font-semibold">{item.category}</span></div> <div className="flex flex-col col-span-full md:col-span-2"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</span> <span className="text-gray-900 dark:text-white font-semibold">{item.description}</span></div> <div className="flex flex-col"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Color</span> <span className="text-gray-900 dark:text-white font-semibold">{item.size.color}</span></div> <div className="flex flex-col"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">UOM</span> <span className="text-gray-900 dark:text-white font-semibold">{item.size.UOM}</span></div> </div> <div className="space-y-3"> <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-200">Size Breakdown</h4> <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg"> <table className="min-w-full text-sm"> <thead className="bg-gray-100 dark:bg-gray-800"><tr> <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-gray-100 dark:bg-gray-800 z-10">Property</th> {item.size.size.map((size, index) => ( <th key={index} className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-24">{size || '-'}</th> ))} </tr></thead> <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"> {sizeDetailRows.map(row => ( <tr key={row.label} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/60"> <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 bg-white dark:bg-gray-900 hover:bg-gray-50/70 dark:hover:bg-gray-800/60 z-10">{row.label}</td> {item.size.size.map((_, index) => ( <td key={index} className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{row.data[index] || '-'}</td> ))} </tr> ))} </tbody> </table> </div> </div> <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4"> <div className="flex flex-col"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">GST</span> <span className="text-gray-900 dark:text-white font-semibold">{item.size.GST}</span></div> <div className="flex flex-col"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Discount %</span> <span className="text-gray-900 dark:text-white font-semibold">{item.size.discount_percentage}</span></div> <div className="flex flex-col"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">HSN</span> <span className="text-gray-900 dark:text-white font-semibold">{item.size.HSN}</span></div> <div className="flex flex-col"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tax Amount</span> <span className="text-gray-900 dark:text-white font-semibold">{item.size.tax_amount}</span></div> </div> </main> <footer className="px-8 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl flex-shrink-0 flex justify-end"> <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Close</button> </footer> </div> </div> ); };
export const ProductDetailsTable = ({ initialItems, onItemsChange, isReadOnly }: { initialItems: ProductItem[]; onItemsChange: (newItems: ProductItem[]) => void; isReadOnly: boolean; }) => { const { theme } = useTheme(); const [items, setItems] = useState<ProductItem[]>(initialItems); const [showModal, setShowModal] = useState(false); const [modalData, setModalData] = useState<ProductItem | null>(null); const [currentPage, setCurrentPage] = useState(1); const itemsPerPage = 5; useEffect(() => { setItems(initialItems); }, [initialItems]); const handleItemChange = (index: number, field: keyof ProductItem, value: string) => { const absoluteIndex = (currentPage - 1) * itemsPerPage + index; const newItems = items.map((item, i) => i === absoluteIndex ? { ...item, [field]: value } : item); setItems(newItems); onItemsChange(newItems); }; const openDetailsModal = (index: number) => { setModalData(items[(currentPage - 1) * itemsPerPage + index]); setShowModal(true); }; const headers: { key: keyof ProductItem | 'size_details', label: string, className?: string }[] = [ { key: 's_no', label: 'S.No', className: 'w-16' }, { key: 'category', label: 'Category', className: 'w-48' }, { key: 'description', label: 'Description' }, { key: 'design_code', label: 'Design Code', className: 'w-40' }, { key: 'size_details', label: 'Size Details', className: 'w-52 text-center' }, ]; const totalPages = Math.ceil(items.length / itemsPerPage); const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage); return ( <> <div className="overflow-x-auto"> <table className="w-full text-sm"> <thead><tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-600'}`}>{headers.map(h => ( <th key={h.key} className={`py-3 px-4 font-semibold text-left ${h.className} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{h.label}</th> ))}</tr></thead> <tbody> {currentItems.map((item, index) => ( <tr key={item.s_no} className={`border-b transition-colors duration-200 group ${theme === 'dark' ? 'border-gray-700/50 hover:bg-gray-700/20' : 'border-gray-100 hover:bg-gray-50/70'}`}> {headers.map(header => ( <td key={header.key} className="p-2 align-middle"> {header.key !== 'size_details' ? ( <input type="text" value={item[header.key as keyof Omit<ProductItem, 'size'>] as string} onChange={(e) => handleItemChange(index, header.key as keyof ProductItem, e.target.value)} readOnly={isReadOnly} className={`w-full p-2 bg-transparent border-2 border-transparent focus:ring-0 rounded-md outline-none transition-all ${theme === 'dark' ? 'text-gray-300 focus:bg-gray-900 focus:border-violet-500' : 'text-gray-700 focus:bg-white focus:border-violet-400'} ${isReadOnly ? 'pointer-events-none' : ''}`} /> ) : ( <div className="p-2 flex items-center justify-center gap-4"> <span className={`text-sm font-medium px-3 py-1 rounded-full ${theme === 'dark' ? 'text-gray-300 bg-gray-600' : 'text-gray-700 bg-gray-200/80'}`}>{item.size.size.length} sizes</span> <button onClick={() => openDetailsModal(index)} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md font-semibold transition-all shadow-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-violet-800 hover:border-violet-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-violet-50 hover:border-violet-500 hover:text-violet-700'}`} title="View Size Details"> <Eye className="w-4 h-4"/> Details </button> </div> )} </td> ))} </tr> ))} </tbody> </table> </div> <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /> <SizeDetailsModal isOpen={showModal} onClose={() => setShowModal(false)} item={modalData} /> </> ); };
export const StatusBadge = ({ status, large = false, theme = 'light' }: { status: Document['status'], large?: boolean, theme?: 'light' | 'dark' }) => { const lightStyles = { Queued: 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-600/20', Processing: 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20 animate-pulse', Processed: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20', Failed: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20', }; const darkStyles = { Queued: 'bg-blue-900/50 text-blue-300 ring-1 ring-inset ring-blue-400/30', Processing: 'bg-yellow-900/50 text-yellow-300 ring-1 ring-inset ring-yellow-400/30 animate-pulse', Processed: 'bg-green-900/50 text-green-300 ring-1 ring-inset ring-green-400/30', Failed: 'bg-red-900/50 text-red-300 ring-1 ring-inset ring-red-400/30', }; const styles = theme === 'light' ? lightStyles : darkStyles; const size = large ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'; return <span className={`${size} rounded-full font-semibold capitalize ${styles[status]}`}>{status}</span>; };
export const ImageViewer = ({ src, alt }: { src: string, alt: string }) => {
    const [zoom, setZoom] = useState(1);
    const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
    const handleResetZoom = () => setZoom(1);

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-800 rounded-xl border border-gray-700 shadow-2xl shadow-gray-900/40">
            <div className="w-full h-full flex items-center justify-center">
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-full object-contain transition-transform duration-300 ease-in-out"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                />
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-gray-900/50 backdrop-blur-sm border border-white/20 rounded-lg p-1.5">
                <button onClick={handleZoomOut} title="Zoom Out" className="p-2 text-white hover:bg-white/20 rounded-md transition-colors"><ZoomOut className="w-5 h-5"/></button>
                <button onClick={handleResetZoom} title="Reset Zoom" className="p-2 text-white hover:bg-white/20 rounded-md transition-colors"><RotateCcw className="w-5 h-5"/></button>
                <button onClick={handleZoomIn} title="Zoom In" className="p-2 text-white hover:bg-white/20 rounded-md transition-colors"><ZoomIn className="w-5 h-5"/></button>
            </div>
        </div>
    );
};

export const InputField = ({ label, readOnly=false, ...props }: { label: string; name: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; readOnly?: boolean }) => {
    const { theme } = useTheme();
    return (
        <div>
            <label className={`block text-sm font-medium capitalize mb-1.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{label.replace(/_/g, ' ')}</label>
            <input type="text" {...props} readOnly={readOnly} className={`block w-full rounded-lg shadow-sm sm:text-sm p-2.5 transition-all ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:border-violet-500 focus:ring-violet-500' : 'bg-gray-50/80 border-gray-300 focus:border-violet-500 focus:ring-violet-500'} ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`} />
        </div>
    );
};

export const AccordionItem = ({ title, children, isOpen, onClick, isTable = false }: { title: string; children: ReactNode; isOpen: boolean; onClick: () => void; isTable?: boolean; }) => {
    const { theme } = useTheme();
    return (
        <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-lg' : 'shadow-sm'} ${theme === 'dark' ? `border-gray-700 bg-[#1C1C2E]` : `border-gray-200 bg-white`}`}>
            <button onClick={onClick} className={`w-full flex justify-between items-center p-4 font-semibold text-left transition-colors ${isOpen ? 'bg-gray-50 dark:bg-gray-800/50' : ''} ${theme === 'dark' ? 'text-white hover:bg-gray-700/50' : 'text-gray-800 hover:bg-gray-50'}`}>
                <span>{title}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
                <div className={`p-4 border-t ${isTable ? '' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5'} ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}