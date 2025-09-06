import { useMemo, type FC, useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { CheckCircle2, FileCheck2, Loader2, XCircle, type LucideProps, FileClock, AlertCircle } from 'lucide-react';
import { StatusBadge } from './Helper';
import type { Document, QueuedDocument, ProcessedDocument, FailedDocument } from '../../interfaces/Types';
import { useNavigate } from 'react-router-dom';
import { getQueuedDocuments, getProcessedDocuments, getFailedDocuments, getDocumentSummary } from '../../lib/api/Api';
import { useToast } from '../../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { itemVariants, containerVariants } from './Animation';

const getAccentColors = (color: string, theme: string) => {
    const isDark = theme === 'dark';
    switch (color) {
        case 'blue':
            return {
                text: isDark ? 'text-blue-400' : 'text-blue-500',
                bg: isDark ? 'bg-blue-900/50' : 'bg-blue-100',
                textAccent: isDark ? 'text-blue-300' : 'text-blue-800',
            };
        case 'green':
            return {
                text: isDark ? 'text-green-400' : 'text-green-500',
                bg: isDark ? 'bg-green-900/50' : 'bg-green-100',
                textAccent: isDark ? 'text-green-300' : 'text-green-800',
            };
        case 'red':
             return {
                text: isDark ? 'text-red-400' : 'text-red-500',
                bg: isDark ? 'bg-red-900/50' : 'bg-red-100',
                textAccent: isDark ? 'text-red-300' : 'text-red-800',
            };
        default:
            return { text: '', bg: '', textAccent: '' };
    }
}

const StatusColumn: FC<{
    title: string,
    docs: Document[],
    count: number,
    icon: React.ElementType<LucideProps>,
    accentColor: string,
    isLoading: boolean
}> = ({ title, docs, count, icon: Icon, accentColor, isLoading }) => {
    const { theme } = useTheme();
    const textPrimary = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';
    const colors = getAccentColors(accentColor, theme);

    const getDocumentDetail = (doc: Document) => {
        switch (doc.status) {
            case 'Processed':
                return (doc as ProcessedDocument).supplierName;
            case 'Queued':
            case 'Processing':
                return `Uploaded by ${(doc as QueuedDocument).uploadedBy}`;
            case 'Failed':
                 return `Uploaded by ${(doc as FailedDocument).uploadedBy}`;
            default:
                return 'N/A';
        }
    }

    return (
        <motion.div variants={itemVariants} className={`p-4 rounded-lg h-full flex flex-col ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/80'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                    <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{title}</h4>
                </div>
                <span className={`px-2.5 py-0.5 text-sm font-semibold rounded-full ${colors.bg} ${colors.textAccent}`}>
                    {count}
                </span>
            </div>
            <div className="space-y-2 flex-grow">
                 <AnimatePresence mode="wait">
                    {isLoading ? (
                         <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center">
                            <Loader2 className={`w-8 h-8 animate-spin ${colors.text}`} />
                        </motion.div>
                    ) : docs.length > 0 ? (
                        <motion.div
                            key="docs"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-2"
                        >
                            {docs.map(doc => (
                                <motion.div
                                    key={doc.id}
                                    variants={itemVariants}
                                    className={`p-3 rounded-lg transition-transform transform hover:-translate-y-1 cursor-pointer ${theme === 'dark' ? 'bg-gray-900/50 hover:bg-gray-900' : 'bg-white hover:bg-gray-50'}`}
                                    whileHover={{ y: -3 }}
                                >
                                    <p className={`font-semibold text-sm truncate ${textPrimary}`}>
                                        {doc.name}
                                    </p>
                                    <div className="flex justify-between items-center mt-1.5">
                                        <p className={`text-xs truncate pr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {getDocumentDetail(doc)}
                                        </p>
                                        <StatusBadge status={doc.status} theme={theme} />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className={`text-center py-8 h-full flex flex-col justify-center items-center text-sm border-2 border-dashed rounded-lg ${theme === 'dark' ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-300'}`}
                        >
                            <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className='font-semibold'>All clear!</p>
                            <p className='text-xs'>No documents to show.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const DashboardStatusTable = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [counts, setCounts] = useState({ queued: 0, processed: 0, failed: 0 });
    const [queuedDocs, setQueuedDocs] = useState<Document[]>([]);
    const [processedDocs, setProcessedDocs] = useState<Document[]>([]);
    const [failedDocs, setFailedDocs] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummaryAndDocs = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const summary = await getDocumentSummary(addToast);
                setCounts({
                    queued: summary.waiting || 0,
                    processed: summary.processed || 0,
                    failed: summary.failed || 0
                });

                const promises = [];
                if (summary.waiting > 0) promises.push(getQueuedDocuments(addToast));
                else promises.push(Promise.resolve([]));

                if (summary.processed > 0) promises.push(getProcessedDocuments(addToast));
                else promises.push(Promise.resolve([]));

                if (summary.failed > 0) promises.push(getFailedDocuments(addToast));
                else promises.push(Promise.resolve([]));
                
                const [queued, processed, failed] = await Promise.all(promises);

                setQueuedDocs(queued);
                setProcessedDocs(processed);
                setFailedDocs(failed);
            } catch (err) {
                 setError("Failed to load document overview. Please try again later.");
                 addToast({
                    type: 'error',
                    message: 'Could not fetch document summary.',
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummaryAndDocs();
    }, [addToast]);
    
    const isColumnLoading = (count: number, docs: Document[]) => isLoading || (count > 0 && docs.length === 0);

    const cardData = useMemo(() => ({
        queued: {
            docs: queuedDocs.slice(0, 5),
            count: counts.queued,
            isLoading: isColumnLoading(counts.queued, queuedDocs)
        },
        processed: {
            docs: processedDocs.slice(0, 5),
            count: counts.processed,
            isLoading: isColumnLoading(counts.processed, processedDocs)
        },
        failed: {
            docs: failedDocs.slice(0, 5),
            count: counts.failed,
            isLoading: isColumnLoading(counts.failed, failedDocs)
        }
    }), [queuedDocs, processedDocs, failedDocs, counts, isLoading]);

    const cardClasses = `p-4 md:p-6 rounded-2xl shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`;

    return (
        <div className={cardClasses}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                 <h3 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Document Status Overview</h3>
                 <button onClick={() => navigate('/queue')} className="text-sm font-semibold text-violet-500 dark:text-violet-400 hover:underline self-start sm:self-center">
                    View Full Queue &rarr;
                </button>
            </div>
             {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 text-red-400">
                    <AlertCircle className="w-6 h-6" />
                    <span className="font-semibold">{error}</span>
                </div>
            )}
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <StatusColumn title="In Queue" docs={cardData.queued.docs} count={cardData.queued.count} icon={FileClock} accentColor="blue" isLoading={cardData.queued.isLoading} />
                <StatusColumn title="Processed" docs={cardData.processed.docs} count={cardData.processed.count} icon={CheckCircle2} accentColor="green" isLoading={cardData.processed.isLoading} />
                <StatusColumn title="Failed" docs={cardData.failed.docs} count={cardData.failed.count} icon={XCircle} accentColor="red" isLoading={cardData.failed.isLoading} />
            </motion.div>
        </div>
    );
}

export default DashboardStatusTable;