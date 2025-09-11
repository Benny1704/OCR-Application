import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { CheckCircle2, FileClock, XCircle, Loader2, AlertCircle, ArrowRight, FileCheck, Activity, TrendingUp, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDocumentSummary } from '../../lib/api/Api';
import { useToast } from '../../hooks/useToast';
import { motion, type Variants } from 'framer-motion';

const StatusCard = ({ 
    title, 
    count, 
    icon: Icon, 
    color, 
    isLoading, 
    index, 
    description,
    gradient,
    pulseColor,
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
    pulseColor: string;
    onClick: () => void;
}) => {
    const { theme } = useTheme();

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 30, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                delay: index * 0.15,
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        }
    };

    const iconVariants: Variants = {
        hidden: { scale: 0, rotate: -180 },
        visible: {
            scale: 1,
            rotate: 0,
            transition: {
                delay: index * 0.15 + 0.3,
                duration: 0.5,
                ease: "backOut"
            }
        }
    };

    const countVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                delay: index * 0.15 + 0.4,
                duration: 0.4
            }
        }
    };

    return (
        <motion.div
            variants={cardVariants}
            className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ${
                theme === 'dark' 
                    ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-gray-700/30 hover:border-violet-500/40' 
                    : 'bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 hover:border-violet-400/40'
            } hover:shadow-2xl hover:shadow-violet-500/10`}
            whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className={`absolute inset-0 ${gradient}`} />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-full -mr-16 -mt-16" />
            </div>

            {/* Pulse Animation for Active States */}
            {(title === 'In Queue' && count > 0) && (
                <div className={`absolute top-4 right-4 w-3 h-3 ${pulseColor} rounded-full animate-pulse`}>
                    <div className={`absolute inset-0 ${pulseColor} rounded-full animate-ping`} />
                </div>
            )}

            <div className="relative p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <motion.div
                        variants={iconVariants}
                        className={`relative p-3 rounded-2xl ${
                            theme === 'dark'
                                ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/30'
                                : 'bg-gradient-to-br from-gray-100 to-white'
                        } shadow-lg`}
                    >
                        <Icon className={`w-6 h-6 ${color} drop-shadow-sm`} />
                        {/* Icon glow effect */}
                        <div className={`absolute inset-0 ${color.replace('text-', 'bg-').replace('-400', '-200').replace('-500', '-200')} opacity-20 rounded-2xl blur-md`} />
                    </motion.div>
                    
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

                {/* Count Display */}
                <div className="flex-1 flex items-center justify-between">
                    <motion.div variants={countVariants} className="flex-1">
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                <div className={`h-8 w-16 rounded-lg animate-pulse ${
                                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                                }`} />
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className={`text-4xl font-black tracking-tight ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                } drop-shadow-sm`}>
                                    {count.toLocaleString()}
                                </p>
                                {count > 0 && title === 'In Queue' && (
                                    <div className="flex items-center space-x-1">
                                        <Activity className="w-3 h-3 text-blue-400" />
                                        <span className="text-xs text-blue-400 font-medium">Processing</span>
                                    </div>
                                )}
                                {count > 0 && title === 'Completed' && (
                                    <div className="flex items-center space-x-1">
                                        <TrendingUp className="w-3 h-3 text-green-400" />
                                        <span className="text-xs text-green-400 font-medium">Success Rate</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Footer Action */}
                <motion.div 
                    className="flex items-center justify-end mt-4 pt-4 border-t border-gray-200/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.15 + 0.6 }}
                >
                    <div className="flex items-center text-xs font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">
                        <span className="mr-1">View Details</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

const DashboardStatusTable = () => {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [counts, setCounts] = useState({ queued: 0, processed: 0, failed: 0, completed: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const summary = await getDocumentSummary(addToast);
            setCounts({
                queued: summary.waiting || 0,
                processed: summary.processed || 0,
                failed: summary.failed || 0,
                completed: summary.processed || 0,
            });
        } catch (err) {
            setError("Failed to load document summary.");
            addToast({
                type: 'error',
                message: 'Could not fetch document summary.',
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const headerVariants: Variants = {
        hidden: { opacity: 0, y: -20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const handleNavigation = (tab: 'Queued' | 'Processed' | 'Failed' | 'Completed') => {
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
            pulseColor: "bg-blue-400",
            onClick: () => handleNavigation('Queued')
        },
        {
            title: "Processed",
            count: counts.processed,
            icon: Database,
            color: "text-amber-400",
            description: "Needs verification",
            gradient: "bg-gradient-to-br from-amber-500/20 to-amber-600/5",
            pulseColor: "bg-amber-400",
            onClick: () => handleNavigation('Processed')
        },
        {
            title: "Completed",
            count: counts.completed,
            icon: FileCheck,
            color: "text-green-400",
            description: "Successfully reviewed",
            gradient: "bg-gradient-to-br from-green-500/20 to-green-600/5",
            pulseColor: "bg-green-400",
            onClick: () => handleNavigation('Completed')
        },
        {
            title: "Failed",
            count: counts.failed,
            icon: XCircle,
            color: "text-red-400",
            description: "Requires attention",
            gradient: "bg-gradient-to-br from-red-500/20 to-red-600/5",
            pulseColor: "bg-red-400",
            onClick: () => handleNavigation('Failed')
        }
    ];

    const totalDocuments = counts.queued + counts.processed + counts.failed + counts.completed;
    const completionRate = totalDocuments > 0 ? ((counts.completed / totalDocuments) * 100).toFixed(1) : '0';

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`relative p-6 md:p-8 rounded-3xl shadow-2xl border backdrop-blur-sm ${
                theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800/40 to-gray-900/20 border-gray-700/30'
                    : 'bg-gradient-to-br from-white/80 to-gray-50/40 border-gray-200/40'
            }`}
        >
            {/* Background Pattern */}
            {/* <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-violet-500 to-transparent rounded-full -ml-32 -mt-32" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500 to-transparent rounded-full -mr-48 -mb-48" />
            </div> */}

            {/* Header */}
            <motion.div variants={headerVariants} className="relative z-10 mb-8">
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
                    <div className="text-right">
                        <div className={`text-3xl font-black ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                            {completionRate}%
                        </div>
                        <div className={`text-xs font-medium ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            Success Rate
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Error Display */}
            {error && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 flex items-center gap-3 p-4 mb-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20"
                >
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <span className="font-medium text-red-400">{error}</span>
                </motion.div>
            )}

            {/* Status Cards Grid */}
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
                        pulseColor={config.pulseColor}
                        onClick={config.onClick}
                    />
                ))}
            </div>

            {/* Bottom Stats Bar */}
            {!isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="relative z-10 mt-8 pt-6 border-t border-gray-200/20"
                >
                    <div className="flex items-center justify-between text-sm">
                        <div className={`flex items-center space-x-4 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            <span>Total Documents: <strong className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{totalDocuments}</strong></span>
                            <span>•</span>
                            <span>Last Updated: <strong>Just now</strong></span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className={`text-xs font-medium ${
                                theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            }`}>
                                Live
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default DashboardStatusTable;