import { useMemo, type FC } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { initialMockDocuments } from '../../lib/MockData';
import { CheckCircle2, FileCheck2, Loader2, XCircle, type LucideProps } from 'lucide-react';
import { StatusBadge } from './Helper';
import type { Document } from '../../interfaces/Types';
import { useNavigate } from 'react-router-dom';

const StatusColumn: FC<{ 
    title: string, 
    docs: Document[], 
    count: number,
    icon: React.ElementType<LucideProps>,
    accentColor: string 
}> = ({ title, docs, count, icon: Icon, accentColor }) => {
    const { theme } = useTheme();
    const textPrimary = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';

    return (
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/80'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 text-${accentColor}-500 dark:text-${accentColor}-400`} />
                    <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{title}</h4>
                </div>
                <span className={`px-2.5 py-0.5 text-sm font-semibold rounded-full bg-${accentColor}-100 text-${accentColor}-800 dark:bg-${accentColor}-900/50 dark:text-${accentColor}-300`}>
                    {count}
                </span>
            </div>
            <div className="space-y-2">
                {docs.length > 0 ? docs.map(doc => (
                    <div 
                        key={doc.id} 
                        className={`p-3 rounded-lg transition-transform transform hover:-translate-y-1 cursor-pointer ${theme === 'dark' ? 'bg-gray-900/50 hover:bg-gray-900' : 'bg-white hover:bg-gray-50'}`}
                    >
                        <p className={`font-semibold text-sm truncate ${textPrimary}`}>
                            {doc.name} 
                        </p>
                        <div className="flex justify-between items-center mt-1">
                            <p className={`text-xs truncate pr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {title === 'Processed' ? doc.supplierName : doc.uploadedBy}
                            </p>
                            <StatusBadge status={doc.status} theme={theme} />
                        </div>
                    </div>
                )) : (
                    <div className={`text-center py-8 text-sm border-2 border-dashed rounded-lg ${theme === 'dark' ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-300'}`}>
                        <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>All clear!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const DashboardStatusTable = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const cardClasses = `p-6 rounded-2xl shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`;

    const { queued, processed, failed } = useMemo(() => {
        const allDocs = initialMockDocuments;
        return {
            queued: {
                docs: allDocs.filter(d => d.status === 'Queued' || d.status === 'Processing').slice(0, 4),
                count: allDocs.filter(d => d.status === 'Queued' || d.status === 'Processing').length
            },
            processed: {
                docs: allDocs.filter(d => d.status === 'Processed').slice(0, 4),
                count: allDocs.filter(d => d.status === 'Processed').length
            },
            failed: {
                docs: allDocs.filter(d => d.status === 'Failed').slice(0, 4),
                count: allDocs.filter(d => d.status === 'Failed').length
            }
        };
    }, []);

    return (
        <div className={cardClasses}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Document Status Overview</h3>
                <button onClick={() => navigate('/queue')} className="text-sm font-semibold text-violet-500 dark:text-violet-400 hover:underline">
                    View Full Queue &rarr;
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <StatusColumn title="In Queue" docs={queued.docs} count={queued.count} icon={Loader2} accentColor="blue" />
                <StatusColumn title="Processed" docs={processed.docs} count={processed.count} icon={CheckCircle2} accentColor="green" />
                <StatusColumn title="Failed" docs={failed.docs} count={failed.count} icon={XCircle} accentColor="red" />
            </div>
        </div>
    );
}

export default DashboardStatusTable;