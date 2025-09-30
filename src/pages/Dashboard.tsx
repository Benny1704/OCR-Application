import { useEffect, useState, Fragment, useCallback, type ElementType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line, Cell, PieChart, Pie, Legend } from 'recharts';
import { Plus, Banknote, FilePieChart, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, MoreVertical, FileDiff } from 'lucide-react';
import { Menu, Transition } from "@headlessui/react";
import DashboardStatusTable from '../components/common/DashboardStatusTable';
import { useAuth } from '../hooks/useAuth';
import { useSections } from '../contexts/SectionContext'; // 1. Import the useSections hook
import { getTotalDiscountThisMonth, getTotalSpendThisMonth, getFinancialObligations, getInvoiceCount, getSpendByVendor, getDiscountByVendor } from '../lib/api/Api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';
import Animation, { headerVariants, sectionVariants, bouncyButtonVariants, bouncyComponentVariants } from '../components/common/Animation';
import { motion, type Variants } from 'framer-motion';
import PillToggle from '../components/common/PillToggle';
import ModernDropdown from '../components/common/ModernDropdown';

const iconMap: { [key: string]: ElementType } = {
    Wallet,
    FileDiff,
    Banknote,
    TrendingUp,
};

// Helper function to format numbers in Indian currency format for KPI cards
const formatIndianCurrency = (value: number) => {
    if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
        return `₹${(value / 100000).toFixed(2)} L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
};

// Helper function for chart tooltips to show full numbers with Indian commas
const formatTooltipIndianCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
};

// Helper function for chart Y-Axis to show abbreviated values
const formatAxisValue = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
};


interface MetricCardProps {
    title: string;
    value: string;
    icon: ElementType;
    change?: string;
    changeType?: 'increase' | 'decrease';
    index: number;
}

interface ChartCardProps {
    title: string;
    subtitle: string;
    icon: ElementType;
    children: ReactNode;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
    data: any[];
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
    topN?: number;
    setTopN?: (n: number) => void;
    fullWidth?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  formatter?: (value: any) => string;
}

const MetricCard = ({ title, value, icon: Icon, change, changeType }: MetricCardProps) => {
    const { theme } = useTheme();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    return (
        <motion.div
            variants={bouncyComponentVariants}
            className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/40'
                    : 'bg-gradient-to-br from-white to-gray-50/70 border border-gray-200/60'
            }`}
        >
            <div className="relative p-5 h-full flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div
                        className={`relative p-2.5 rounded-xl ${
                            theme === 'dark'
                                ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/40'
                                : 'bg-gradient-to-br from-gray-100 to-white'
                        } shadow-md`}
                    >
                        <Icon className="w-5 h-5 text-violet-500 drop-shadow-sm" />
                        <div className="absolute inset-0 bg-violet-200 opacity-15 rounded-xl blur-sm" />
                    </div>

                    <div className="text-right">
                        <h4 className={`font-medium text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        } tracking-wide`}>
                            {title}
                        </h4>
                        <p className={`text-xs mt-0.5 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                            {currentMonth}
                        </p>
                    </div>
                </div>

                {/* Value Display */}
                <div
                    className="flex-1 flex flex-col justify-end"
                >
                    <p className={`text-3xl font-bold tracking-tight ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    } drop-shadow-sm`}>
                        {value}
                    </p>
                    {change && (
                        <div className="flex items-center mt-2">
                            {changeType === 'increase' ?
                                <ArrowUpRight className="w-3 h-3 text-green-400 mr-1" /> :
                                <ArrowDownRight className="w-3 h-3 text-red-400 mr-1" />
                            }
                            <p className={`text-xs font-semibold mr-2 ${
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
                </div>
            </div>
        </motion.div>
    );
};

const VendorChartFilterMenu = ({ selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, topN, setTopN }: any) => {
    const { theme } = useTheme();
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => ({ value: y, label: y.toString() }));
    const months = [
        { value: 0, label: 'All Months' },
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];
    const topNOptions = [
        { value: 5, label: 'Top 5' },
        { value: 10, label: 'Top 10' },
        { value: 0, label: 'All' }
    ];

    return (
        <Menu as="div" className="relative inline-block text-left z-50">
            <div>
                <Menu.Button className={`inline-flex justify-center w-full p-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/75`}>
                    <MoreVertical className="w-4 h-4" />
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
                <Menu.Items className={`absolute right-0 w-56 mt-2 origin-top-right divide-y rounded-xl shadow-2xl ring-1 focus:outline-none z-50 ${
                    theme === 'dark'
                        ? 'bg-gray-800/95 backdrop-blur-sm divide-gray-700 ring-gray-700/50'
                        : 'bg-white/95 backdrop-blur-sm divide-gray-100 ring-black/5'
                }`}>
                    <div className="px-4 py-3">
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                            Chart Filters
                        </p>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                        <div>
                            <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                Top
                            </label>
                            <ModernDropdown
                                options={topNOptions}
                                selectedValue={topN}
                                onValueSelect={(value) => setTopN(Number(value))}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                Year
                            </label>
                            <ModernDropdown
                                options={years}
                                selectedValue={selectedYear}
                                onValueSelect={(value) => setSelectedYear(Number(value))}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                Month
                            </label>
                            <ModernDropdown
                                options={months}
                                selectedValue={selectedMonth}
                                onValueSelect={(value) => setSelectedMonth(Number(value))}
                            />
                        </div>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
};

const ChartFilterMenu = ({ filterType, setFilterType, selectedYear, setSelectedYear, fromYear, setFromYear, toYear, setToYear }: any) => {
    const { theme } = useTheme();
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => ({ value: y, label: y.toString() }));

    return (
        <Menu as="div" className="relative inline-block text-left z-50">
            <div>
                <Menu.Button className={`inline-flex justify-center w-full p-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/75`}>
                    <MoreVertical className="w-4 h-4" />
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
                <Menu.Items className={`absolute right-0 w-56 mt-2 origin-top-right divide-y rounded-xl shadow-2xl ring-1 focus:outline-none z-50 ${
                    theme === 'dark'
                        ? 'bg-gray-800/95 backdrop-blur-sm divide-gray-700 ring-gray-700/50'
                        : 'bg-white/95 backdrop-blur-sm divide-gray-100 ring-black/5'
                }`}>
                    <div className="px-4 py-3">
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                            Chart Filters
                        </p>
                    </div>
                    {filterType && setFilterType && (
                        <>
                            <div className="px-4 py-3 flex justify-center">
                                <PillToggle
                                    options={[
                                        { label: 'Monthly', value: 'monthly' },
                                        { label: 'Yearly', value: 'yearly' },
                                    ]}
                                    selected={filterType}
                                    onSelect={setFilterType}
                                />
                            </div>
                                    {filterType === 'monthly' ? (
                                        <div className="px-4 py-3">
                                            <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                                Year
                                            </label>
                                            <ModernDropdown
                                                options={years}
                                                selectedValue={selectedYear}
                                                onValueSelect={(value) => setSelectedYear(Number(value))}
                                            />
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 space-y-3">
                                            <div>
                                                <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                                    From Year
                                                </label>
                                                <ModernDropdown
                                                    options={years}
                                                    selectedValue={fromYear}
                                                    onValueSelect={(value) => setFromYear(Number(value))}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                                    To Year
                                                </label>
                                                <ModernDropdown
                                                    options={years}
                                                    selectedValue={toYear}
                                                    onValueSelect={(value) => setToYear(Number(value))}
                                                />
                                            </div>
                                        </div>
                                    )}
                        </>
                    )}
                </Menu.Items>
            </Transition>
        </Menu>
    );
};

const CustomTooltip = ({ active, payload, formatter }: CustomTooltipProps) => {
    const { theme } = useTheme();

    if (active && payload && payload.length) {
        return (
            <div className={`p-3 rounded-xl shadow-lg border backdrop-blur-sm ${
                theme === 'dark' ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
            }`}>
                <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {payload[0].payload.name}
                </p>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatter ? formatter(payload[0].value) : payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

const NoDataDisplay = () => {
    const { theme } = useTheme();

    // Define colors based on the theme for a cohesive look
    const primaryColor = 'rgba(139, 92, 246, 0.7)'; // A slightly transparent violet
    const secondaryColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const headingColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';

    // Animation variants for Framer Motion
    const svgVariants: Variants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: (i: number) => ({
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { delay: i * 0.2, type: "spring", duration: 1.5, bounce: 0 },
                opacity: { delay: i * 0.2, duration: 0.01 }
            }
        })
    };
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                className="flex flex-col items-center"
            >
                {/* A more illustrative and modern SVG representation */}
                <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Ghostly representation of a bar chart in the background */}
                    <motion.path d="M25 80 V40" stroke={secondaryColor} strokeWidth="6" strokeLinecap="round" variants={svgVariants} initial="hidden" animate="visible" custom={0.1} />
                    <motion.path d="M42 80 V60" stroke={secondaryColor} strokeWidth="6" strokeLinecap="round" variants={svgVariants} initial="hidden" animate="visible" custom={0.2} />
                    <motion.path d="M59 80 V50" stroke={secondaryColor} strokeWidth="6" strokeLinecap="round" variants={svgVariants} initial="hidden" animate="visible" custom={0.3} />
                    <motion.path d="M76 80 V70" stroke={secondaryColor} strokeWidth="6" strokeLinecap="round" variants={svgVariants} initial="hidden" animate="visible" custom={0.4} />

                    {/* A magnifying glass with a question mark, indicating a search with no results */}
                    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1.2 }}>
                        <circle cx="45" cy="45" r="15" stroke={primaryColor} strokeWidth="3" fill="transparent" />
                        <line x1="57" y1="57" x2="67" y2="67" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
                        <text x="45" y="49" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="bold" fill={primaryColor} textAnchor="middle">?</text>
                    </motion.g>
                </svg>

                <h3 className={`text-xl font-semibold mt-6 ${headingColor}`}>
                    Nothing to display
                </h3>
                <p className={`text-sm mt-2 max-w-xs ${textColor}`}>
                    We couldn't find any data for your current selection. Please try different filters.
                </p>
            </motion.div>
        </div>
    );
};

const ChartCard = ({ title, subtitle, icon: Icon, children, isLoading, error, onRetry, data, isVendorChart = false, fullWidth = false, ...filterProps }: ChartCardProps) => {
    const { theme } = useTheme();
    const hasData = data && data.length > 0;

    return (
        <motion.div
            variants={bouncyComponentVariants}
            className={`relative p-6 rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-300 ${
                theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-gray-700/40'
                    : 'bg-gradient-to-br from-white/90 to-gray-50/50 border-gray-200/50'
            } ${fullWidth ? 'lg:col-span-2' : ''}`}
        >
            <div className="relative z-20 flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                        theme === 'dark'
                            ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/40'
                            : 'bg-gradient-to-br from-gray-100 to-white'
                    } shadow-md`}>
                        <Icon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                    </div>
                    <div>
                        <h3 className={`text-lg font-semibold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                            {title}
                        </h3>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
                    </div>
                </div>
                {!error && (isVendorChart ? <VendorChartFilterMenu {...filterProps} /> : <ChartFilterMenu {...filterProps} />)}
            </div>

            <div className="relative z-10 h-96">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <Loader type="dots"/>
                    </div>
                ) : error ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <ErrorDisplay message={error} onRetry={onRetry} />
                    </div>
                ) : hasData ? (
                    <div
                        className="w-full h-full"
                    >
                        {children}
                    </div>
                ) : (
                    <NoDataDisplay />
                )}
            </div>
        </motion.div>
    );
};

const Dashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { getSectionNameById } = useSections(); // 2. Get the lookup function from the context
    
    const [kpiMetrics, setKpiMetrics] = useState<any[]>([]);
    const [kpiError, setKpiError] = useState<string | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

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
    const [spendByVendorTopN, setSpendByVendorTopN] = useState<number>(10);

    const [discountByVendorSelectedYear, setDiscountByVendorSelectedYear] = useState<number>(new Date().getFullYear());
    const [discountByVendorSelectedMonth, setDiscountByVendorSelectedMonth] = useState<number>(0);
    const [discountByVendorTopN, setDiscountByVendorTopN] = useState<number>(10);
    const [sectionFilter, setSectionFilter] = useState<'overall' | 'current'>('overall');

    const fetchInitialData = useCallback(async () => {
        if (!user) return;
        try {
            const sectionId = sectionFilter === 'current' ? user.section : undefined;
            const [spendResponse, discountResponse] = await Promise.all([
                getTotalSpendThisMonth(sectionId),
                getTotalDiscountThisMonth(sectionId),
            ]);

            const spendData = spendResponse.total_spend_this_month;
            const discountData = discountResponse.total_discount_this_month;

            const metrics = [
                {
                    title: "Total Spend",
                    value: formatIndianCurrency(spendData.total_spend),
                    icon: "Banknote",
                    change: `${Math.abs(spendData.percentage_change)}%`,
                    changeType: spendData.percentage_change >= 0 ? 'increase' : 'decrease',
                },
                {
                    title: "Total Discount",
                    value: formatIndianCurrency(Math.abs(discountData.total_discount)),
                    icon: "Wallet",
                    change: `${Math.abs(discountData.percentage_change)}%`,
                    changeType: discountData.percentage_change >= 0 ? 'increase' : 'decrease',
                },
            ];

            setKpiMetrics(metrics);
        } catch (err: any) {
            setKpiError(err.message || "Could not load key performance indicators.");
        }
    }, [sectionFilter, user]);

    const fetchFinancials = useCallback(async () => {
        if (!user) return;
        setIsFinancialsLoading(true);
        setFinancialsError(null);
        try {
            const sectionId = sectionFilter === 'current' ? user.section : undefined;
            const financialData = await getFinancialObligations(financialFilterType, financialFilterType === 'monthly' ? financialSelectedYear : financialFromYear, financialToYear, sectionId);
            setFinancialObligationsData(financialData || []);
        } catch (err: any) {
            setFinancialsError(err.message || "Could not load financial obligations data.");
        } finally {
             setIsFinancialsLoading(false);
        }
    }, [financialFilterType, financialSelectedYear, financialFromYear, financialToYear, sectionFilter, user]);

    const fetchInvoiceCount = useCallback(async () => {
        if (!user) return;
        setIsInvoiceCountLoading(true);
        setInvoiceCountError(null);
        try {
            const sectionId = sectionFilter === 'current' ? user.section : undefined;
            const invoiceData = await getInvoiceCount(invoiceFilterType, invoiceFilterType === 'monthly' ? invoiceSelectedYear : invoiceFromYear, invoiceToYear, sectionId);
            setInvoiceCountData(invoiceData || []);
        } catch (err: any) {
            setInvoiceCountError(err.message || "Could not load invoice count data.");
        } finally {
            setIsInvoiceCountLoading(false);
        }
    }, [invoiceFilterType, invoiceSelectedYear, invoiceFromYear, invoiceToYear, sectionFilter, user]);

    const fetchSpendByVendor = useCallback(async () => {
        if (!user) return;
        setIsSpendByVendorLoading(true);
        setSpendByVendorError(null);
        try {
            const sectionId = sectionFilter === 'current' ? user.section : undefined;
            const spendData = await getSpendByVendor(spendByVendorSelectedYear, spendByVendorSelectedMonth || undefined, sectionId);
            const transformedData = spendData.map((item: any) => ({ name: item.vendor_name, value: item.spend }));

            if (spendByVendorTopN > 0 && transformedData.length > spendByVendorTopN) {
                const sortedData = [...transformedData].sort((a, b) => b.value - a.value);
                const topN = sortedData.slice(0, spendByVendorTopN);
                const othersSum = sortedData.slice(spendByVendorTopN).reduce((acc, curr) => acc + curr.value, 0);

                const finalData = [...topN];
                if (othersSum > 0) {
                    finalData.push({ name: 'Others', value: othersSum });
                }
                setSpendByVendorData(finalData);
            } else {
                setSpendByVendorData(transformedData || []);
            }
        } catch (err: any) {
            setSpendByVendorError(err.message || "Could not load spending by vendor data.");
        } finally {
            setIsSpendByVendorLoading(false);
        }
    }, [spendByVendorSelectedYear, spendByVendorSelectedMonth, spendByVendorTopN, sectionFilter, user]);

    const fetchDiscountByVendor = useCallback(async () => {
        if (!user) return;
        setIsDiscountByVendorLoading(true);
        setDiscountByVendorError(null);
        try {
            const sectionId = sectionFilter === 'current' ? user.section : undefined;
            const discountData = await getDiscountByVendor(discountByVendorSelectedYear, discountByVendorSelectedMonth || undefined, sectionId);
            const transformedData = discountData.map((item: any) => ({ name: item.vendor_name, value: item.discount_pct }));

            if (discountByVendorTopN > 0 && transformedData.length > discountByVendorTopN) {
                const sortedData = [...transformedData].sort((a, b) => b.value - a.value);
                const topN = sortedData.slice(0, discountByVendorTopN);
                const others = sortedData.slice(discountByVendorTopN);

                const finalData = [...topN];
                if (others.length > 0) {
                    // For percentages, an average is more appropriate for the "Others" category
                    const othersAvg = others.reduce((acc, curr) => acc + curr.value, 0) / others.length;
                    finalData.push({ name: 'Others', value: othersAvg });
                }
                setDiscountByVendorData(finalData);
            } else {
                setDiscountByVendorData(transformedData || []);
            }
        } catch (err: any) {
            setDiscountByVendorError(err.message || "Could not load discounts by vendor data.");
        } finally {
            setIsDiscountByVendorLoading(false);
        }
    }, [discountByVendorSelectedYear, discountByVendorSelectedMonth, discountByVendorTopN, sectionFilter, user]);

    useEffect(() => {
        const loadPageData = async () => {
            setIsPageLoading(true);
            await fetchInitialData();
            setIsPageLoading(false);
        };
        if (user) {
            loadPageData();
        }
    }, [fetchInitialData, user]);

    useEffect(() => { if(user) fetchFinancials(); }, [fetchFinancials, user]);
    useEffect(() => { if(user) fetchInvoiceCount(); }, [fetchInvoiceCount, user]);
    useEffect(() => { if(user) fetchSpendByVendor(); }, [fetchSpendByVendor, user]);
    useEffect(() => { if(user) fetchDiscountByVendor(); }, [fetchDiscountByVendor, user]);

    const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    const textHeader = theme === 'dark' ? 'text-white' : 'text-gray-900';
    
    // 3. Look up the section name using the user's section ID
    const sectionName = user?.section ? getSectionNameById(user.section) : '';

    // Modern vibrant color palette for charts
    const vendorColors = ['#8b5cf6', '#ec4899', '#22c55e', '#f97316', '#3b82f6', '#14b8a6', '#f43f5e', '#eab308', '#0ea5e9', '#d946ef', '#64748b'];

    if (isPageLoading) {
        return <Loader type="wifi"/>;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className={`text-center p-8 rounded-2xl ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                    <h2 className={`text-2xl font-bold ${textHeader}`}>Access Denied</h2>
                    <p className={`mt-2 ${textSecondary}`}>You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }
    
    const getSubtitle = (filterType: string, selectedYear: number, fromYear: number, toYear: number, selectedMonth?: number) => {
        if (filterType === 'yearly') {
            return `Yearly report from ${fromYear} to ${toYear}`;
        }
        
        if (selectedMonth && selectedMonth > 0) {
            const monthName = new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' });
            return `${monthName} report for ${selectedYear}`;
        }

        return `Monthly report for ${selectedYear}`;
    }

    const renderSpendChart = () => {
        const processedData = [...spendByVendorData]
            .sort((a, b) => b.value - a.value)
            .map(item => ({
                ...item,
                value: item.value === 0 ? 0.00001 : item.value,
            }));

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={processedData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        labelLine={false}
                    >
                        {processedData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={(value) => formatTooltipIndianCurrency(value)} />} />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        formatter={(value, entry) => {
                            const { color } = entry;
                            const { value: payloadValue } = entry.payload || {};
                            return (
                                <span style={{ color }}>
                                    {value} - {formatTooltipIndianCurrency(payloadValue)}
                                </span>
                            );
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    const renderDiscountChart = () => {
        const processedData = [...discountByVendorData]
            .sort((a, b) => b.value - a.value)
            .map(item => ({
                ...item,
                value: item.value === 0 ? 0.00001 : item.value,
            }));
        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={processedData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        labelLine={false}
                    >
                        {processedData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={(value) => `${value.toFixed(2)}%`} />} />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        formatter={(value, entry) => {
                            const { color } = entry;
                            const { value: payloadValue } = entry.payload || {};
                            return (
                                <span style={{ color }}>
                                    {value} - {payloadValue?.toFixed(2)}%
                                </span>
                            );
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    return (
        <Animation>
            <div
                className="flex flex-col gap-6"
            >
                {/* Header Section */}
                <motion.div
                    variants={headerVariants}
                    className="flex flex-col md:flex-row justify-between md:items-center gap-4"
                >
                    <div>
                        <h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${textHeader} mb-2`}>
                            {/* 4. Display the section name in the title */}
                            Insights {sectionFilter === 'current' && sectionName ? `- ${sectionName}` : ''}
                        </h1>
                        <p className={`text-sm ${textSecondary}`}>
                            Welcome back, <span className="font-medium text-violet-500">{user?.username || 'Admin'}</span>!
                            Here's your business insights.
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <PillToggle
                            options={[
                                { label: 'Overall', value: 'overall' },
                                { label: 'Current Section', value: 'current' },
                            ]}
                            selected={sectionFilter}
                            onSelect={setSectionFilter}
                        />
                        <motion.button
                            variants={bouncyButtonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => navigate('/upload')}
                            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-500/50 text-sm group"
                        >
                            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300"/>
                            <span>Upload Invoice</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* KPI Cards Section */}
                <motion.div variants={sectionVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    { kpiError ? (
                        <div className={`md:col-span-2 p-6 rounded-2xl shadow-lg border ${
                            theme === 'dark'
                            ? 'bg-gray-800/50 border-gray-700/50'
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
                <motion.div variants={bouncyComponentVariants}>
                    <DashboardStatusTable section_id={sectionFilter === 'current' ? user?.section : undefined} />
                </motion.div>

                {/* Financial Charts Section */}
                <motion.div variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard
                        title="Invoice Amount"
                        subtitle={getSubtitle(financialFilterType, financialSelectedYear, financialFromYear, financialToYear)}
                        icon={Banknote}
                        isLoading={isFinancialsLoading}
                        error={financialsError}
                        onRetry={fetchFinancials}
                        data={financialObligationsData}
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
                                <XAxis
                                    dataKey={financialFilterType === 'monthly' ? 'month' : 'year'}
                                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={formatAxisValue}
                                />
                                <Tooltip
                                    cursor={{fill: 'rgba(139, 92, 246, 0.1)'}}
                                    contentStyle={{
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                                        borderRadius: '0.75rem',
                                        fontSize: '12px'
                                    }}
                                    formatter={(value: number) => formatTooltipIndianCurrency(value)}
                                />
                                <Bar
                                    dataKey="expense"
                                    fill="url(#expenseGradient)"
                                    name="Expense"
                                    radius={[4, 4, 0, 0]}
                                    barSize={16}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard
                        title="Invoice Count"
                        subtitle={getSubtitle(invoiceFilterType, invoiceSelectedYear, invoiceFromYear, invoiceToYear)}
                        icon={FilePieChart}
                        isLoading={isInvoiceCountLoading}
                        error={invoiceCountError}
                        onRetry={fetchInvoiceCount}
                        data={invoiceCountData}
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
                                <XAxis
                                    dataKey={invoiceFilterType === 'monthly' ? 'month' : 'year'}
                                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{stroke: 'rgba(139, 92, 246, 0.2)', strokeWidth: 2}}
                                    contentStyle={{
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                                        borderRadius: '0.75rem',
                                        fontSize: '12px'
                                    }}
                                    formatter={(value: number) => `${value} invoices`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#a78bfa"
                                    strokeWidth={2.5}
                                    dot={{ r: 4, strokeWidth: 2, fill: theme === 'dark' ? '#1C1C2E' : '#fff' }}
                                    activeDot={{ r: 6 }}
                                    name="Invoices"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </motion.div>

                {/* Vendor Charts Section - Same Row */}
                <motion.div variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard
                        title="Spending by Vendor"
                        subtitle={getSubtitle('monthly', spendByVendorSelectedYear, 0, 0, spendByVendorSelectedMonth)}
                        icon={TrendingUp}
                        isLoading={isSpendByVendorLoading}
                        error={spendByVendorError}
                        onRetry={fetchSpendByVendor}
                        data={spendByVendorData}
                        selectedYear={spendByVendorSelectedYear}
                        setSelectedYear={setSpendByVendorSelectedYear}
                        selectedMonth={spendByVendorSelectedMonth}
                        setSelectedMonth={setSpendByVendorSelectedMonth}
                        topN={spendByVendorTopN}
                        setTopN={setSpendByVendorTopN}
                        isVendorChart={true}
                        fullWidth={true}
                    >
                        {renderSpendChart()}
                    </ChartCard>

                    <ChartCard
                        title="Discounts by Vendor"
                        subtitle={getSubtitle('monthly', discountByVendorSelectedYear, 0, 0, discountByVendorSelectedMonth)}
                        icon={Wallet}
                        isLoading={isDiscountByVendorLoading}
                        error={discountByVendorError}
                        onRetry={fetchDiscountByVendor}
                        data={discountByVendorData}
                        selectedYear={discountByVendorSelectedYear}
                        setSelectedYear={setDiscountByVendorSelectedYear}
                        selectedMonth={discountByVendorSelectedMonth}
                        setSelectedMonth={setDiscountByVendorSelectedMonth}
                        topN={discountByVendorTopN}
                        setTopN={setDiscountByVendorTopN}
                        isVendorChart={true}
                        fullWidth={true}
                    >
                       {renderDiscountChart()}
                    </ChartCard>
                </motion.div>
            </div>
        </Animation>
    );
}

export default Dashboard;