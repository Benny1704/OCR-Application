import { useState, useMemo, type ChangeEvent } from "react";


const FilterDatagrid = ({documents}: Document[]) => {
    const { theme } = useTheme();
    const [filters, setFilters] = useState({ name: '', supplierName: '', invoiceId: '', irnNumber: '', uploadDate: '', invoiceDate: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc =>
            Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                const docValue = doc[key as keyof typeof doc]?.toString().toLowerCase() || '';
                return docValue.includes(value.toLowerCase());
            })
        );
    }, [documents, filters]);
    
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    const currentDocuments = filteredDocuments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    
    const headers = [
        { key: 'name', label: 'Filename' }, { key: 'supplierName', label: 'Supplier' }, { key: 'invoiceId', label: 'Invoice ID' },
        { key: 'irnNumber', label: 'IRN Number' }, { key: 'uploadDate', label: 'Upload Date' }, { key: 'invoiceDate', label: 'Invoice Date' }, { key: 'actions', label: 'Actions'}
    ];

    return (
        <div className={`rounded-2xl shadow-lg border animate-fade-in-up transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`}>
            <div className="p-4 sm:p-6">
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Processed Documents</h2>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Review and manage all successfully processed documents.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className={`text-xs ${theme === 'dark' ? 'text-gray-400 bg-gray-900/50' : 'text-gray-500 bg-gray-50'}`}>
                        <tr>
                            {headers.map(h => (
                                <th key={h.key} scope="col" className="px-4 py-3 font-semibold whitespace-nowrap align-top">
                                    <div className="flex flex-col gap-2">
                                        <span>{h.label}</span>
                                        {h.key !== 'actions' && (
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                <input
                                                    type="text"
                                                    name={h.key}
                                                    placeholder="Filter..."
                                                    value={filters[h.key as keyof typeof filters]}
                                                    onChange={handleFilterChange}
                                                    className={`w-full pl-8 pr-2 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white focus:border-violet-500' : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'}`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={theme === 'dark' ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                        {currentDocuments.length > 0 ? currentDocuments.map(doc => (
                            <tr key={doc.id} className={`transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700/50' : 'bg-white hover:bg-gray-50'}`}>
                                <td className={`px-4 py-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{doc.name}</td>
                                <td className={`px-4 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{doc.supplierName}</td>
                                <td className={`px-4 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{doc.invoiceId || '-'}</td>
                                <td className={`px-4 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{doc.irnNumber || '-'}</td>
                                <td className={`px-4 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{doc.uploadDate}</td>
                                <td className={`px-4 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{doc.invoiceDate}</td>
                                <td className="px-4 py-4">
                                    <button onClick={() => setPage('editableTable')} className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm ${theme === 'dark' ? 'bg-violet-600 text-white hover:bg-violet-500' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`} title="View & Edit Details">
                                        <Pencil className="w-3 h-3" />
                                        View / Edit
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={headers.length} className="text-center py-16 text-gray-500 dark:text-gray-400"><FileText className="w-12 h-12 mx-auto mb-2"/><p className="font-semibold">No documents found for your filters.</p></td></tr>
                        )}
                    </tbody>
                </table>
            </div>
             <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
}

export default FilterDatagrid