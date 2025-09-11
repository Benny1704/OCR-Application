import React, { useEffect, useState, Fragment, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line, Cell, PieChart, Pie, Legend } from 'recharts';
import { Plus, Banknote, FilePieChart, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, MoreVertical, FileDiff } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Menu, Transition, Switch } from "@headlessui/react";
import DashboardStatusTable from '../components/common/DashboardStatusTable';
import { useAuth } from '../hooks/useAuth';
import { getTotalDiscountThisMonth, getTotalSpendThisMonth, getFinancialObligations, getInvoiceCount, getSpendByVendor, getDiscountByVendor } from '../lib/api/Api';
import { useToast } from '../hooks/useToast';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';

// Animation and design choices:
// - Variants use easing curves that feel responsive without jank.
// - Staggered entrances improve hierarchy without overwhelming the user.
// - GPU-friendly transforms + willChange hint minimize reflow/flicker during transitions.
const iconMap: { [key: string]: React.ElementType } = {
    Wallet,
    FileDiff,
    Banknote,
    TrendingUp,
};

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    change?: string;
    changeType?: 'increase' | 'decrease';
    index: number;
}

interface ChartCardProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
    filterType?: 'monthly' | 'yearly';
    setFilterType?: (filter: 'monthly' | 'yearly') => void;
    selectedYear?: number;
    setSelectedYear?: (year: number) => void;
    fromYear?: number;
    setFromYear?: (year: number) => void;
    toYear?: number;
    setToYear?: (year: number) => void;
    selectedMonth?: number;
    setSelectedMonth?: (month: number) => void;
    isVendorChart?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  formatter?: (value: any) => string;
}

// MODIFICATION: Updated MetricCard to remove "View Details" and modernize the layout.
const MetricCard = ({ title, value, icon: Icon, change, changeType, index }: MetricCardProps) => {
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

    const valueVariants: Variants = {
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
            className={`group relative overflow-hidden rounded-3xl transition-all duration-500 ${
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
            style={{ willChange: 'transform, opacity' }}
        >

            {/* Pulse Animation for Positive Change - draws attention to improvement */}
            {changeType === 'increase' && (
                <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping" />
                </div>
            )}

            <div className="relative p-6 h-full flex flex-col justify-between">
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
                        <Icon className="w-6 h-6 text-violet-500 drop-shadow-sm" />
                        <div className="absolute inset-0 bg-violet-200 opacity-20 rounded-2xl blur-md" />
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
                            Monthly Overview
                        </p>
                    </div>
                </div>

                {/* Value Display */}
                <motion.div variants={valueVariants} className="flex-1 flex flex-col justify-end">
                    <p className={`text-4xl font-black tracking-tight ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    } drop-shadow-sm`}>
                        {value}
                    </p>
                    {change && (
                        <div className="flex items-center mt-2">
                            {changeType === 'increase' ?
                                <ArrowUpRight className="w-4 h-4 text-green-400 mr-1" /> :
                                <ArrowDownRight className="w-4 h-4 text-red-400 mr-1" />
                            }
                            <p className={`text-sm font-semibold mr-2 ${
                                changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {change}
                            </p>
                            <p className={`text-xs ${
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                                vs last month
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

const VendorChartFilterMenu = ({ selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }: any) => {
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        { value: 0, label: 'All Months' },
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                    <MoreVertical className="w-5 h-5" />
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 w-64 mt-2 origin-top-right bg-white dark:bg-[#2a2a3e] divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                    <div className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">Chart Options</p>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Year</label>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3a3a52] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-md">
                                {years.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Month</label>
                            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3a3a52] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-md">
                                {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                            </select>
                        </div>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
};

const ChartFilterMenu = ({ filterType, setFilterType, selectedYear, setSelectedYear, fromYear, setFromYear, toYear, setToYear }: any) => {
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    return (
    <Menu as="div" className="relative inline-block text-left">
        <div>
            <Menu.Button className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                <MoreVertical className="w-5 h-5" />
            </Menu.Button>
        </div>
        <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
        >
            <Menu.Items className="absolute right-0 w-64 mt-2 origin-top-right bg-white dark:bg-[#2a2a3e] divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">Chart Options</p>
                </div>
                { filterType && setFilterType && (
                    <>
                        <div className="px-4 py-3">
                             <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Yearly / Monthly</span>
                                 <Switch
                                     checked={filterType === 'yearly'}
                                     onChange={() => setFilterType(filterType === 'monthly' ? 'yearly' : 'monthly')}
                                     className={`${filterType === 'yearly' ? 'bg-violet-600' : 'bg-gray-400 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                                 >
                                     <span className={`${filterType === 'yearly' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                 </Switch>
                            </div>
                        </div>
                         <AnimatePresence initial={false}>
                            <motion.div
                                key={filterType}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                {filterType === 'monthly' ? (
                                    <div className="px-4 py-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Year</label>
                                        <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3a3a52] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-md">
                                            {years.map(year => <option key={year} value={year}>{year}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="px-4 py-3 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">From</label>
                                            <select value={fromYear} onChange={(e) => setFromYear(parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3a3a52] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-md">
                                                {years.map(year => <option key={year} value={year}>{year}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">To</label>
                                            <select value={toYear} onChange={(e) => setToYear(parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3a3a52] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-md">
                                                {years.map(year => <option key={year} value={year}>{year}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </>
                )}
            </Menu.Items>
        </Transition>
    </Menu>
    )
};

const CustomTooltip = ({ active, payload, formatter }: CustomTooltipProps) => {
    const { theme } = useTheme();

    if (active && payload && payload.length) {
        return (
            <div className={`p-3 rounded-xl shadow-lg border ${theme === 'dark' ? 'bg-[#2a2a3e] border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="font-bold text-gray-900 dark:text-gray-100">{`${payload[0].payload.name}`}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{`Value: ${formatter ? formatter(payload[0].value) : payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

const ChartCard = ({ title, icon: Icon, children, isLoading, error, onRetry, isVendorChart = false, ...filterProps }: ChartCardProps) => {
    const { theme } = useTheme();

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        }
    };

    const headerVariants: Variants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { delay: 0.2, duration: 0.5 }
        }
    };

    return (
        <motion.div
            variants={cardVariants}
            className={`relative p-6 md:p-8 rounded-3xl shadow-2xl border backdrop-blur-sm ${
                theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800/40 to-gray-900/20 border-gray-700/30'
                    : 'bg-gradient-to-br from-white/80 to-gray-50/40 border-gray-200/40'
            }`}
            style={{ willChange: 'transform, opacity' }}
        >

            <motion.div variants={headerVariants} className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${
                        theme === 'dark'
                            ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/30'
                            : 'bg-gradient-to-br from-gray-100 to-white'
                    } shadow-lg`}>
                        <Icon className="w-6 h-6 text-violet-500 dark:text-violet-400" />
                    </div>
                    <h3 className={`text-xl md:text-2xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        {title}
                    </h3>
                </div>
                {!error && (isVendorChart ? <VendorChartFilterMenu {...filterProps} /> : <ChartFilterMenu {...filterProps} />)}
            </motion.div>

            <div className="relative z-10 h-72 md:h-80">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <Loader type="dots"/>
                    </div>
                ) : error ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <ErrorDisplay message={error} onRetry={onRetry} />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="w-full h-full"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        {children}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

const Dashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [kpiMetrics, setKpiMetrics] = useState<any[]>([]);
    const [kpiError, setKpiError] = useState<string | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const { addToast } = useToast();

    const [financialObligationsData, setFinancialObligationsData] = useState<any[]>([]);
    const [invoiceCountData, setInvoiceCountData] = useState<any[]>([]);
    const [spendByVendorData, setSpendByVendorData] = useState<any[]>([]);
    const [discountByVendorData, setDiscountByVendorData] = useState<any[]>([]);

    const [isFinancialsLoading, setIsFinancialsLoading] = useState(true);
    const [isInvoiceCountLoading, setIsInvoiceCountLoading] = useState(true);
    const [isSpendByVendorLoading, setIsSpendByVendorLoading] = useState(true);
    const [isDiscountByVendorLoading, setIsDiscountByVendorLoading] = useState(true);

    const [financialsError, setFinancialsError] = useState<string | null>(null);
    const [invoiceCountError, setInvoiceCountError] = useState<string | null>(null);
    const [spendByVendorError, setSpendByVendorError] = useState<string | null>(null);
    const [discountByVendorError, setDiscountByVendorError] = useState<string | null>(null);

    const [financialFilterType, setFinancialFilterType] = useState<'monthly' | 'yearly'>('monthly');
    const [invoiceFilterType, setInvoiceFilterType] = useState<'monthly' | 'yearly'>('monthly');

    const [financialSelectedYear, setFinancialSelectedYear] = useState<number>(new Date().getFullYear());
    const [financialFromYear, setFinancialFromYear] = useState<number>(new Date().getFullYear() - 5);
    const [financialToYear, setFinancialToYear] = useState<number>(new Date().getFullYear());

    const [invoiceSelectedYear, setInvoiceSelectedYear] = useState<number>(new Date().getFullYear());
    const [invoiceFromYear, setInvoiceFromYear] = useState<number>(new Date().getFullYear() - 5);
    const [invoiceToYear, setInvoiceToYear] = useState<number>(new Date().getFullYear());

    const [spendByVendorSelectedYear, setSpendByVendorSelectedYear] = useState<number>(new Date().getFullYear());
    const [spendByVendorSelectedMonth, setSpendByVendorSelectedMonth] = useState<number>(0);

    const [discountByVendorSelectedYear, setDiscountByVendorSelectedYear] = useState<number>(new Date().getFullYear());
    const [discountByVendorSelectedMonth, setDiscountByVendorSelectedMonth] = useState<number>(0);

    const fetchInitialData = useCallback(async () => {
        try {
            const [spendResponse, discountResponse] = await Promise.all([
                getTotalSpendThisMonth(addToast),
                getTotalDiscountThisMonth(addToast),
            ]);

            const spendData = spendResponse.total_spend_this_month;
            const discountData = discountResponse.total_discount_this_month;

            const metrics = [
                {
                    title: "Total Spend This Month",
                    value: `₹${spendData.total_spend.toLocaleString()}`,
                    icon: "Banknote",
                    change: `${Math.abs(spendData.percentage_change)}%`,
                    changeType: spendData.percentage_change >= 0 ? 'increase' : 'decrease',
                },
                {
                    title: "Total Discount This Month",
                    value: `₹${Math.abs(discountData.total_discount).toLocaleString()}`,
                    icon: "Wallet",
                    change: `${Math.abs(discountData.percentage_change)}%`,
                    changeType: discountData.percentage_change >= 0 ? 'increase' : 'decrease',
                },
            ];

            setKpiMetrics(metrics);
        } catch (err: any) {
            setKpiError(err.message || "Could not load key performance indicators.");
        }
    }, [addToast]);

    const fetchFinancials = useCallback(async () => {
        setIsFinancialsLoading(true);
        setFinancialsError(null);
        try {
            const financialData = await getFinancialObligations(financialFilterType, financialFilterType === 'monthly' ? financialSelectedYear : financialFromYear, financialToYear);
            setFinancialObligationsData(financialData || []);
        } catch (err: any) {
            setFinancialsError(err.message || "Could not load financial obligations data.");
        } finally {
             setIsFinancialsLoading(false);
        }
    }, [financialFilterType, financialSelectedYear, financialFromYear, financialToYear]);

    const fetchInvoiceCount = useCallback(async () => {
        setIsInvoiceCountLoading(true);
        setInvoiceCountError(null);
        try {
            const invoiceData = await getInvoiceCount(invoiceFilterType, invoiceFilterType === 'monthly' ? invoiceSelectedYear : invoiceFromYear, invoiceToYear);
            setInvoiceCountData(invoiceData || []);
        } catch (err: any) {
            setInvoiceCountError(err.message || "Could not load invoice count data.");
        } finally {
            setIsInvoiceCountLoading(false);
        }
    }, [invoiceFilterType, invoiceSelectedYear, invoiceFromYear, invoiceToYear]);

    const fetchSpendByVendor = useCallback(async () => {
        setIsSpendByVendorLoading(true);
        setSpendByVendorError(null);
        try {
            const spendData = await getSpendByVendor(spendByVendorSelectedYear, spendByVendorSelectedMonth || undefined);
            const transformedData = spendData.map((item: any) => ({ name: item.vendor_name, value: item.spend }));
            setSpendByVendorData(transformedData || []);
        } catch (err: any) {
            setSpendByVendorError(err.message || "Could not load spending by vendor data.");
        } finally {
            setIsSpendByVendorLoading(false);
        }
    }, [spendByVendorSelectedYear, spendByVendorSelectedMonth]);

    const fetchDiscountByVendor = useCallback(async () => {
        setIsDiscountByVendorLoading(true);
        setDiscountByVendorError(null);
        try {
            const discountData = await getDiscountByVendor(discountByVendorSelectedYear, discountByVendorSelectedMonth || undefined);
            const transformedData = discountData.map((item: any) => ({ name: item.vendor_name, value: item.discount_pct }));
            setDiscountByVendorData(transformedData || []);
        } catch (err: any) {
            setDiscountByVendorError(err.message || "Could not load discounts by vendor data.");
        } finally {
            setIsDiscountByVendorLoading(false);
        }
    }, [discountByVendorSelectedYear, discountByVendorSelectedMonth]);

    useEffect(() => {
        const loadPageData = async () => {
            setIsPageLoading(true);
            await fetchInitialData();
            setIsPageLoading(false);
        };
        loadPageData();
    }, [fetchInitialData]);

    useEffect(() => { fetchFinancials(); }, [fetchFinancials]);
    useEffect(() => { fetchInvoiceCount(); }, [fetchInvoiceCount]);
    useEffect(() => { fetchSpendByVendor(); }, [fetchSpendByVendor]);
    useEffect(() => { fetchDiscountByVendor(); }, [fetchDiscountByVendor]);

    const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    const textHeader = theme === 'dark' ? 'text-white' : 'text-gray-900';
    
    // MODIFICATION: Using a more diverse and modern color palette.
    const vendorColors = ['#8b5cf6', '#ec4899', '#22c55e', '#f97316', '#3b82f6', '#14b8a6', '#f43f5e'];

    // Animation variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94]
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

    if (isPageLoading) {
        return <Loader type="wifi"/>;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    const renderSpendChart = () => {
        if (spendByVendorData.length > 0 && spendByVendorData.length <= 5) {
            return (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={spendByVendorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {spendByVendorData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip formatter={(value) => `₹${value.toLocaleString()}`} />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            );
        }
        return (
           <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendByVendorData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                        content={<CustomTooltip formatter={(value) => `₹${value.toLocaleString()}`} />}
                    />
                    <Bar dataKey="value" name="Spend" radius={[4, 4, 0, 0]} barSize={20}>
                        {spendByVendorData.map((_, index: number) => <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        )
    }

    const renderDiscountChart = () => {
        if (discountByVendorData.length > 0 && discountByVendorData.length <= 5) {
            return (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={discountByVendorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {discountByVendorData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />
                            ))}
                        </Pie>
                         <Tooltip content={<CustomTooltip formatter={(value) => `${value}%`} />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            );
        }
        return (
           <ResponsiveContainer width="100%" height="100%">
                <BarChart data={discountByVendorData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                        content={<CustomTooltip formatter={(value) => `${value}%`} />}
                    />
                    <Bar dataKey="value" name="Discount" radius={[4, 4, 0, 0]} barSize={20}>
                        {discountByVendorData.map((_, index: number) => <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        )
    }

    return (
        <motion.div
            className="flex flex-col gap-6 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ willChange: 'transform, opacity' }}
        >
            {/* Header Section */}
            <motion.div
                className="flex flex-col md:flex-row justify-between md:items-center gap-4"
                variants={headerVariants}
            >
                <div>
                    <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${textHeader} mb-2`}>
                        Dashboard
                    </h1>
                    <p className={`text-lg ${textSecondary}`}>
                        Welcome back, <span className="font-semibold text-violet-500">{user?.username || 'Admin'}</span>!
                        Here's your business overview.
                    </p>
                </div>
                <motion.button
                    onClick={() => navigate('/upload')}
                    className="flex items-center gap-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/25 focus:outline-none focus:ring-4 focus:ring-violet-500/50 text-base md:text-lg group"
                    whileHover={{
                        scale: 1.05,
                        y: -2,
                        boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300"/>
                    <span>Upload Invoice</span>
                </motion.button>
            </motion.div>

            {/* KPI Cards Section */}
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8" variants={itemVariants}>
                { kpiError ? (
                    <div className={`md:col-span-2 p-6 md:p-8 rounded-3xl shadow-lg border ${
                        theme === 'dark'
                        ? 'bg-[#1C1C2E] border-gray-700/50'
                        : 'bg-white border-gray-200/80'
                    }`}>
                        <ErrorDisplay message={kpiError} onRetry={fetchInitialData} />
                    </div>
                ) : (
                    kpiMetrics.map((metric: any, i: number) => (
                        <MetricCard
                            key={metric.title}
                            title={metric.title}
                            value={metric.value}
                            icon={iconMap[metric.icon] || FilePieChart}
                            change={metric.change}
                            changeType={metric.changeType}
                            index={i}
                        />
                    ))
                )}
            </motion.div>

            {/* Status Table Section */}
            <motion.div variants={itemVariants}>
                <DashboardStatusTable />
            </motion.div>

            {/* Financial Charts Section */}
            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8" variants={itemVariants}>
                <ChartCard
                    title="Financial Obligations"
                    icon={Banknote}
                    isLoading={isFinancialsLoading}
                    error={financialsError}
                    onRetry={fetchFinancials}
                    filterType={financialFilterType}
                    setFilterType={setFinancialFilterType}
                    selectedYear={financialSelectedYear}
                    setSelectedYear={setFinancialSelectedYear}
                    fromYear={financialFromYear}
                    setFromYear={setFinancialFromYear}
                    toYear={financialToYear}
                    setToYear={setFinancialToYear}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financialObligationsData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey={financialFilterType === 'monthly' ? 'month' : 'year'} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.75rem' }}/>
                            <Bar dataKey="expense" fill="url(#expenseGradient)" name="Expense" radius={[4, 4, 0, 0]} barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Invoice Count"
                    icon={FilePieChart}
                    isLoading={isInvoiceCountLoading}
                    error={invoiceCountError}
                    onRetry={fetchInvoiceCount}
                    filterType={invoiceFilterType}
                    setFilterType={setInvoiceFilterType}
                    selectedYear={invoiceSelectedYear}
                    setSelectedYear={setInvoiceSelectedYear}
                    fromYear={invoiceFromYear}
                    setFromYear={setInvoiceFromYear}
                    toYear={invoiceToYear}
                    setToYear={setInvoiceToYear}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={invoiceCountData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                             <defs>
                                <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey={invoiceFilterType === 'monthly' ? 'month' : 'year'} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{stroke: 'rgba(139, 92, 246, 0.2)', strokeWidth: 2}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.75rem' }}/>
                            <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: theme === 'dark' ? '#1C1C2E' : '#fff' }} activeDot={{ r: 8 }} name="Invoices" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </motion.div>

            {/* Spend by Vendor Chart Section */}
            <motion.div variants={itemVariants}>
               <ChartCard
                    title="Spending by Vendor"
                    icon={TrendingUp}
                    isLoading={isSpendByVendorLoading}
                    error={spendByVendorError}
                    onRetry={fetchSpendByVendor}
                    selectedYear={spendByVendorSelectedYear}
                    setSelectedYear={setSpendByVendorSelectedYear}
                    selectedMonth={spendByVendorSelectedMonth}
                    setSelectedMonth={setSpendByVendorSelectedMonth}
                    isVendorChart={true}
                >
                    {renderSpendChart()}
                </ChartCard>
            </motion.div>

            {/* Discount by Vendor Chart Section */}
            <motion.div variants={itemVariants}>
                <ChartCard
                    title="Discounts by Vendor"
                    icon={Wallet}
                    isLoading={isDiscountByVendorLoading}
                    error={discountByVendorError}
                    onRetry={fetchDiscountByVendor}
                    selectedYear={discountByVendorSelectedYear}
                    setSelectedYear={setDiscountByVendorSelectedYear}
                    selectedMonth={discountByVendorSelectedMonth}
                    setSelectedMonth={setDiscountByVendorSelectedMonth}
                    isVendorChart={true}
                >
                   {renderDiscountChart()}
                </ChartCard>
            </motion.div>
        </motion.div>
    );
}

export default Dashboard;