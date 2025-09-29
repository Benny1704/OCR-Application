import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';
import {  FileClock, XCircle, Loader2, AlertCircle, ArrowRight, FileCheck, Activity, TrendingUp, Database, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDocumentSummary } from '../../lib/api/Api';
import { useToast } from '../../hooks/useToast';
import { motion } from 'framer-motion';
import { bouncyComponentVariants } from './Animation';
import PillToggle from './PillToggle'; // Import the new component

// --- Helper function to format date/time ---
const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'N/A';
    // Format to a simple time string like "9:05 AM"
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const StatusCard = ({
    title,
    count,
    icon: Icon,
    color,
    isLoading,
    description,
    gradient,
    onClick,
}: {
    title: string;
    count: number;
    icon: React.ElementType;
    color: string;
    isLoading: boolean;
    index: number;
    description: string;
    gradient: string;
    onClick: () => void;
}) => {
    const { theme } = useTheme();

    return (
        <motion.div
            variants={bouncyComponentVariants}
            className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ${
                theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-gray-700/30 hover:border-violet-500/40'
                    : 'bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 hover:border-violet-400/40'
            } hover:shadow-2xl hover:shadow-violet-500/10`}
            onClick={onClick}
        >
            <div className="absolute inset-0 opacity-5">
                <div className={`absolute inset-0 ${gradient}`} />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-full -mr-16 -mt-16" />
            </div>

            <div className="relative p-6 h-full flex flex-col justify-between">
                <div>
                    <div className="flex items-start justify-between mb-4">
                        <div
                            className={`relative p-3 rounded-2xl ${
                                theme === 'dark'
                                    ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/30'
                                    : 'bg-gradient-to-br from-gray-100 to-white'
                            } shadow-lg`}
                        >
                            <Icon className={`w-6 h-6 ${color} drop-shadow-sm`} />
                            <div className={`absolute inset-0 ${color.replace('text-', 'bg-').replace('-400', '-200').replace('-500', '-200')} opacity-20 rounded-2xl blur-md`} />
                        </div>

                        <div className="text-right">
                            <h4 className={`font-medium text-sm ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            } tracking-wide`}>
                                {title}
                            </h4>
                            <p className={`text-xs mt-1 ${
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                                {description}
                            </p>
                        </div>
                    </div>

                    <div>
                        {isLoading ? (
                            <div className="flex items-center space-x-2 mt-4">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : (
                             <div className="space-y-1">
                                <p className={`text-4xl font-black tracking-tight ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                } drop-shadow-sm`}>
                                    {count.toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODIFICATION: Improved layout for status indicators and action button. */}
                <div
                    className="flex items-center justify-between mt-4"
                >
                    <div className="flex-1">
                        {!isLoading && count > 0 && title === 'In Queue' && (
                            <div className="flex items-center space-x-1">
                                <Activity className="w-3 h-3 text-blue-400" />
                                <span className="text-xs text-blue-400 font-medium">Processing</span>
                            </div>
                        )}
                        {!isLoading && count > 0 && title === 'Completed' && (
                            <div className="flex items-center space-x-1">
                                <TrendingUp className="w-3 h-3 text-green-400" />
                                <span className="text-xs text-green-400 font-medium">Success Rate</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center text-xs font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">
                        <span className="mr-1">View</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const DashboardStatusTable = ({ section_id }: { section_id?: number }) => {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [counts, setCounts] = useState({ queued: 0, processed: 0, failed: 0, completed: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [timeFilter, setTimeFilter] = useState<'today' | 'all'>('all');

    const fetchSummary = useCallback(async (isRefresh = false) => {
        setIsLoading(true);
        if(!isRefresh) setError(null);
        try {
            const summary = await getDocumentSummary(addToast, section_id, timeFilter === 'today');
            setCounts({
                queued: summary.waiting || 0,
                processed: summary.processed || 0,
                failed: summary.failed || 0,
                completed: summary.completed || 0,
            });
            setLastUpdated(new Date());
            if(isRefresh) {
                addToast({
                    type: 'success',
                    message: 'Document summary updated!',
                });
            }
        } catch (err) {
            setError("Failed to load document summary.");
        } finally {
            setIsLoading(false);
        }
    }, [section_id, timeFilter]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const handleNavigation = (tab: 'Queued' | 'Yet to Review' | 'Failed' | 'Completed') => {
        if (tab === 'Completed') {
            navigate('/document');
        } else {
            navigate('/queue', { state: { defaultTab: tab } });
        }
    };

    const statusConfig = [
        {
            title: "In Queue",
            count: counts.queued,
            icon: FileClock,
            color: "text-blue-400",
            description: "Awaiting processing",
            gradient: "bg-gradient-to-br from-blue-500/20 to-blue-600/5",
            onClick: () => handleNavigation('Queued')
        },
        {
            title: "For Review",
            count: counts.processed,
            icon: Database,
            color: "text-amber-400",
            description: "Needs verification",
            gradient: "bg-gradient-to-br from-amber-500/20 to-amber-600/5",
            onClick: () => handleNavigation('Yet to Review')
        },
        {
            title: "Reviewed",
            count: counts.completed,
            icon: FileCheck,
            color: "text-green-400",
            description: "Successfully reviewed",
            gradient: "bg-gradient-to-br from-green-500/20 to-green-600/5",
            onClick: () => handleNavigation('Completed')
        },
        {
            title: "Failed",
            count: counts.failed,
            icon: XCircle,
            color: "text-red-400",
            description: "Requires attention",
            gradient: "bg-gradient-to-br from-red-500/20 to-red-600/5",
            onClick: () => handleNavigation('Failed')
        }
    ];

    return (
        <motion.div
            variants={bouncyComponentVariants}
            className={`relative p-6 md:p-8 rounded-3xl shadow-2xl border backdrop-blur-sm ${
                theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800/40 to-gray-900/20 border-gray-700/30'
                    : 'bg-gradient-to-br from-white/80 to-gray-50/40 border-gray-200/40'
            }`}
        >
            <div className="relative z-10 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`text-2xl font-bold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        } mb-2`}>
                            Document Pipeline
                        </h3>
                        <p className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            Real-time processing overview
                        </p>
                    </div>
                    <PillToggle
                        options={[
                            { label: 'All Time', value: 'all' },
                            { label: 'Today', value: 'today' },
                        ]}
                        selected={timeFilter}
                        onSelect={setTimeFilter}
                    />
                </div>
            </div>

            {error && !isLoading && (
                <div
                    className="relative z-10 flex items-center gap-3 p-4 mb-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20"
                >
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <span className="font-medium text-red-400">{error}</span>
                </div>
            )}

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statusConfig.map((config, index) => (
                    <StatusCard
                        key={config.title}
                        title={config.title}
                        count={config.count}
                        icon={config.icon}
                        color={config.color}
                        isLoading={isLoading}
                        index={index}
                        description={config.description}
                        gradient={config.gradient}
                        onClick={config.onClick}
                    />
                ))}
            </div>

            {!isLoading && (
                <div
                    className="relative z-10 mt-8 pt-6 border-t border-gray-200/20"
                >
                    <div className="flex items-center justify-between text-sm">
                        <div className={`flex items-center space-x-4 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            <span>Last Updated: <strong>{formatLastUpdated(lastUpdated)}</strong></span>
                             <button
                                onClick={() => fetchSummary(true)}
                                className={`ml-2 p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                title="Refresh Summary"
                            >
                                <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className={`text-xs font-medium ${
                                theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            }`}>
                                Live
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default DashboardStatusTable;