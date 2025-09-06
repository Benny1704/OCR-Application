import { useMemo, type FC, useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { CheckCircle2, FileCheck2, Loader2, XCircle, type LucideProps, FileClock, AlertCircle, ArrowRight, User } from 'lucide-react';
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
                text: isDark ? 'text-violet-400' : 'text-violet-500',
                bg: isDark ? 'bg-violet-900/50' : 'bg-violet-100',
                textAccent: isDark ? 'text-violet-300' : 'text-violet-800',
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

// Helper to format date and time
const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};


const StatusColumn: FC<{
    title: string,
    docs: Document[],
    count: number,
    icon: React.ElementType<LucideProps>,
    accentColor: string,
    isLoading: boolean
}> = ({ title, docs, count, icon: Icon, accentColor, isLoading }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const textPrimary = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
    const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const colors = getAccentColors(accentColor, theme);

    const handleCardClick = (doc: Document) => {
        if(doc.status === 'Processed') {
            navigate(`/review/${doc.id}`);
        } else {
            navigate('/queue');
        }
    }

    return (
        <motion.div variants={itemVariants} className={`p-4 rounded-xl h-full flex flex-col ${theme === 'dark' ? 'bg-[#1C1C2E]' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                    <h4 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
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
                            {docs.map(doc => {
                                const docBase = doc as QueuedDocument | ProcessedDocument | FailedDocument;
                                return (
                                <motion.div
                                    key={doc.id}
                                    variants={itemVariants}
                                    className={`p-3 rounded-lg transition-all cursor-pointer border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-700/50 hover:bg-gray-900/80 hover:border-violet-500/50' : 'bg-white hover:bg-gray-50 border-gray-200/80 hover:border-violet-400'}`}
                                    whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
                                    onClick={() => handleCardClick(doc)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 overflow-hidden">
                                            {doc.status === 'Processed' ? (
                                                <>
                                                    <p className={`font-semibold text-sm truncate ${textPrimary}`} title={(doc as ProcessedDocument).invoiceId}>
                                                        {(doc as ProcessedDocument).invoiceId || 'No Invoice ID'}
                                                    </p>
                                                    <p className={`text-xs truncate ${textSecondary}`} title={(doc as ProcessedDocument).supplierName}>
                                                        {(doc as ProcessedDocument).supplierName || 'No Supplier'}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className={`font-semibold text-sm truncate ${textPrimary}`} title={doc.name}>
                                                        {doc.name}
                                                    </p>
                                                    <p className={`text-xs ${textSecondary}`}>
                                                        {formatDateTime(docBase.uploadDate)}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200'} ${textSecondary}`}>
                                            <User className="w-3 h-3" />
                                            <span className="truncate" title={docBase.uploadedBy}>{docBase.uploadedBy || 'Admin'}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )})}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className={`text-center py-8 h-full flex flex-col justify-center items-center text-sm border-2 border-dashed rounded-lg ${theme === 'dark' ? 'text-gray-600 border-gray-700' : 'text-gray-400 border-gray-300'}`}
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

    const fetchSummaryAndDocs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // First, get the summary counts
            const summary = await getDocumentSummary(addToast);
            setCounts({
                queued: summary.waiting || 0,
                processed: summary.processed || 0,
                failed: summary.failed || 0
            });

            // Conditionally fetch details only if counts are greater than zero
            const promises = [
                summary.waiting > 0 ? getQueuedDocuments(addToast) : Promise.resolve([]),
                summary.processed > 0 ? getProcessedDocuments(addToast) : Promise.resolve([]),
                summary.failed > 0 ? getFailedDocuments(addToast) : Promise.resolve([])
            ];
            
            const [queued, processed, failed] = await Promise.all(promises);

            setQueuedDocs(queued.map((item: any) => ({
                name: item.file_name,
                uploadDate: item.uploaded_on,
                uploadedBy: item.uploaded_by,
                status: item.status || "Queued",
            })));
    
            setProcessedDocs(processed.map((item: any) => ({
                name: item.file_name,
                supplierName: item.supplier_name,
                invoiceId: item.invoice_id,
                irnNumber: item.irn,
                uploadedBy: item.uploaded_by,
                uploadDate: item.uploaded_at,
                invoiceDate: item.invoice_date,
                status: "Processed",
            })));
    
            setFailedDocs(failed.map((item: any) => ({
                name: item.file_name,
                uploadedBy: item.uploaded_by,
                uploadDate: item.uploaded_on,
                status: "Failed",
            })));

        } catch (err) {
            setError("Failed to load document overview. Please try again later.");
            addToast({
                type: 'error',
                message: 'Could not fetch document summary.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchSummaryAndDocs();
    }, [fetchSummaryAndDocs]);
    
    // This logic ensures the loader shows until the details for that column have arrived.
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

    const cardClasses = `p-4 md:p-6 rounded-2xl shadow-lg border transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700/50' : 'bg-white border-gray-200/80'}`;

    return (
        <div className={cardClasses}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                 <h3 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Document Status Overview</h3>
                 <button onClick={() => navigate('/queue')} className="group flex items-center gap-1 text-sm font-semibold text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors self-start sm:self-center">
                   <span>View Full Queue</span>
                   <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
             {error && !isLoading && (
                 <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 text-red-400 mb-4">
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