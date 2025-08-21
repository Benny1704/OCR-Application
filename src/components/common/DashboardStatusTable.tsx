import { useMemo, type FC } from 'react'
import { useTheme } from '../../hooks/useTheme';
import { initialMockDocuments } from '../../lib/MockData';
import { FileCheck2 } from 'lucide-react';
import { StatusBadge } from './Helper';
import type { Document } from '../../interfaces/Types';
import { useNavigate } from 'react-router';

const DashboardStatusTable = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const cardClasses = `p-6 rounded-2xl shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`;

    const { queued, processed, failed } = useMemo(() => ({
        queued: initialMockDocuments.filter(d => d.status === 'Queued' || d.status === 'Processing').slice(0, 4),
        processed: initialMockDocuments.filter(d => d.status === 'Processed').slice(0, 4),
        failed: initialMockDocuments.filter(d => d.status === 'Failed').slice(0, 4),
    }), []);

    const StatusColumn: FC<{ title: string, docs: Document[] }> = ({ title, docs }) => (
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <h4 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{title}</h4>
            <div className="space-y-2">
                {docs.length > 0 ? docs.map(doc => (
                    <div key={doc.id} className={`p-2.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'}`}>
                        <p className={`font-semibold text-sm truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{doc.supplierName}</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className={`text-xs truncate pr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{doc.name}</p>
                            <StatusBadge status={doc.status} theme={theme} />
                        </div>
                    </div>
                )) : (
                    <div className={`text-center py-5 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        <FileCheck2 className="w-6 h-6 mx-auto mb-1" />
                        <p>All clear!</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={cardClasses}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Document Status Overview</h3>
                <button onClick={() => navigate('/queue')} className="text-sm font-semibold text-violet-500 dark:text-violet-400 hover:underline">
                    View Full Queue &rarr;
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <StatusColumn title="In Queue" docs={queued} />
                <StatusColumn title="Processed" docs={processed} />
                <StatusColumn title="Failed" docs={failed} />
            </div>
        </div>
    );
}

export default DashboardStatusTable
