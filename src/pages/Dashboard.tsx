import React, { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line, Cell, Legend, Pie, PieChart } from 'recharts';
import { Plus, Banknote, FilePieChart, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, MoreVertical, FileDiff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Menu, Transition, Switch } from "@headlessui/react";
import DashboardStatusTable from '../components/common/DashboardStatusTable';
import { useAuth } from '../hooks/useAuth';
import { itemVariants, containerVariants } from '../components/common/Animation';
import { getDashboardData, getFinancialObligations, getInvoiceCount, getSpendByVendor, getDiscountByVendor } from '../lib/api/Api';
import { useToast } from '../hooks/useToast';
import { ChartSkeleton, KpiCardSkeleton } from '../components/common/SkeletonLoaders';

const iconMap: { [key: string]: React.ElementType } = {
    Wallet,
    FileDiff,
    Banknote,
    TrendingUp,
};

interface KpiMetric {
    title: string;
    value: string;
    icon: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
}

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
    error: boolean;
    filterType?: 'monthly' | 'yearly';
    setFilterType?: (filter: 'monthly' | 'yearly') => void;
    selectedYear?: number;
    setSelectedYear?: (year: number) => void;
    fromYear?: number;
    setFromYear?: (year: number) => void;
    toYear?: number;
    setToYear?: (year: number) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  spendByVendorData: { name: string; value: number }[];
}


const MetricCard = ({ title, value, icon: Icon, change, changeType, index }: MetricCardProps) => {
    const { theme } = useTheme();

    const cardClasses = `p-4 md:p-6 rounded-2xl shadow-lg border transition-all duration-300 transform hover:-translate-y-1 ${
        theme === 'dark'
        ? 'bg-[#1C1C2E] border-gray-700/50 hover:border-violet-500'
        : 'bg-white border-gray-200/80 hover:border-violet-400'
    }`;
    const textPrimary = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                delay: index * 0.1, 
                duration: 0.5, 
                ease: "easeOut" 
            } 
        }
    };

    return (
        <motion.div 
            variants={cardVariants}
            // The initial and animate props are managed by the parent motion.div
            className={cardClasses}
        >
            <div className="flex justify-between items-start">
                <h3 className={`text-sm md:text-md font-semibold ${textSecondary}`}>{title}</h3>
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
            </div>
            <p className={`text-2xl md:text-3xl font-bold mt-2 ${textPrimary}`}>{value}</p>
            {change && (
                <div className="flex items-center mt-2">
                    {changeType === 'increase' ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                    <p className={`ml-1 text-xs md:text-sm font-semibold ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>{change}</p>
                    <p className={`ml-2 text-xs md:text-sm ${textSecondary}`}>vs last month</p>
                </div>
            )}
        </motion.div>
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


const CustomPieTooltip = ({ active, payload, spendByVendorData }: CustomTooltipProps) => {
    const { theme } = useTheme();

    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const total = spendByVendorData.reduce((acc, entry) => acc + entry.value, 0);
        const percent = ((data.value / total) * 100).toFixed(2);

        return (
            <div className={`p-3 rounded-xl shadow-lg border ${theme === 'dark' ? 'bg-[#2a2a3e] border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="font-bold text-gray-900 dark:text-gray-100">{`${data.name}`}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{`Spend: ₹${data.value.toLocaleString()}`}</p>
                <p className="text-sm text-violet-500 dark:text-violet-400">{`Contribution: ${percent}%`}</p>
            </div>
        );
    }
    return null;
};

const Dashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [kpiError, setKpiError] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const { addToast } = useToast();

    const [financialObligationsData, setFinancialObligationsData] = useState<any[]>([]);
    const [invoiceCountData, setInvoiceCountData] = useState<any[]>([]);
    const [spendByVendorData, setSpendByVendorData] = useState<any[]>([]);
    const [discountByVendorData, setDiscountByVendorData] = useState<any[]>([]);

    const [isFinancialsLoading, setIsFinancialsLoading] = useState(true);
    const [isInvoiceCountLoading, setIsInvoiceCountLoading] = useState(true);
    const [isSpendByVendorLoading, setIsSpendByVendorLoading] = useState(true);
    const [isDiscountByVendorLoading, setIsDiscountByVendorLoading] = useState(true);

    const [financialsError, setFinancialsError] = useState(false);
    const [invoiceCountError, setInvoiceCountError] = useState(false);
    const [spendByVendorError, setSpendByVendorError] = useState(false);
    const [discountByVendorError, setDiscountByVendorError] = useState(false);

    const [financialFilterType, setFinancialFilterType] = useState<'monthly' | 'yearly'>('monthly');
    const [invoiceFilterType, setInvoiceFilterType] = useState<'monthly' | 'yearly'>('monthly');
    const [spendByVendorFilterType, setSpendByVendorFilterType] = useState<'monthly' | 'yearly'>('monthly');
    const [discountByVendorFilterType, setDiscountByVendorFilterType] = useState<'monthly' | 'yearly'>('monthly');

    const [financialSelectedYear, setFinancialSelectedYear] = useState<number>(new Date().getFullYear());
    const [financialFromYear, setFinancialFromYear] = useState<number>(new Date().getFullYear() - 5);
    const [financialToYear, setFinancialToYear] = useState<number>(new Date().getFullYear());

    const [invoiceSelectedYear, setInvoiceSelectedYear] = useState<number>(new Date().getFullYear());
    const [invoiceFromYear, setInvoiceFromYear] = useState<number>(new Date().getFullYear() - 5);
    const [invoiceToYear, setInvoiceToYear] = useState<number>(new Date().getFullYear());

    const [spendByVendorSelectedYear, setSpendByVendorSelectedYear] = useState<number>(new Date().getFullYear());
    const [spendByVendorFromYear, setSpendByVendorFromYear] = useState<number>(new Date().getFullYear() - 5);
    const [spendByVendorToYear, setSpendByVendorToYear] = useState<number>(new Date().getFullYear());

    const [discountByVendorSelectedYear, setDiscountByVendorSelectedYear] = useState<number>(new Date().getFullYear());
    const [discountByVendorFromYear, setDiscountByVendorFromYear] = useState<number>(new Date().getFullYear() - 5);
    const [discountByVendorToYear, setDiscountByVendorToYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsInitialLoading(true);
            setKpiError(false);
            try {
                const data = await getDashboardData(addToast);
                setDashboardData(data);
            } catch (error) {
                setKpiError(true);
            } finally {
                setIsInitialLoading(false);
            }
        };
       fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchFinancials = async () => {
            setIsFinancialsLoading(true);
            setFinancialsError(false);
            try {
                const financialData = await getFinancialObligations(financialFilterType, financialFilterType === 'monthly' ? financialSelectedYear : financialFromYear, financialToYear);
                setFinancialObligationsData(financialData || []);
            } catch (error) {
                setFinancialsError(true);
            } finally {
                 setIsFinancialsLoading(false);
            }
        };
        fetchFinancials();
    }, [financialFilterType, financialSelectedYear, financialFromYear, financialToYear]);

    useEffect(() => {
        const fetchInvoiceCount = async () => {
            setIsInvoiceCountLoading(true);
            setInvoiceCountError(false);
            try {
                const invoiceData = await getInvoiceCount(invoiceFilterType, invoiceFilterType === 'monthly' ? invoiceSelectedYear : invoiceFromYear, invoiceToYear);
                setInvoiceCountData(invoiceData || []);
            } catch (error) {
                setInvoiceCountError(true);
            } finally {
                setIsInvoiceCountLoading(false);
            }
        };
        fetchInvoiceCount();
    }, [invoiceFilterType, invoiceSelectedYear, invoiceFromYear, invoiceToYear]);

    useEffect(() => {
        const fetchSpendByVendor = async () => {
            setIsSpendByVendorLoading(true);
            setSpendByVendorError(false);
            try {
                const spendData = await getSpendByVendor(spendByVendorFilterType, spendByVendorFilterType === 'monthly' ? spendByVendorSelectedYear : spendByVendorFromYear, spendByVendorToYear);
                setSpendByVendorData(spendData || []);
            } catch (error) {
                setSpendByVendorError(true);
            } finally {
                setIsSpendByVendorLoading(false);
            }
        };
        fetchSpendByVendor();
    }, [spendByVendorFilterType, spendByVendorSelectedYear, spendByVendorFromYear, spendByVendorToYear]);

    useEffect(() => {
        const fetchDiscountByVendor = async () => {
            setIsDiscountByVendorLoading(true);
            setDiscountByVendorError(false);
            try {
                const discountData = await getDiscountByVendor(discountByVendorFilterType, discountByVendorFilterType === 'monthly' ? discountByVendorSelectedYear : discountByVendorFromYear, discountByVendorToYear);
                setDiscountByVendorData(discountData || []);
            } catch (error) {
                setDiscountByVendorError(true);
            } finally {
                setIsDiscountByVendorLoading(false);
            }
        };
        fetchDiscountByVendor();
    }, [discountByVendorFilterType, discountByVendorSelectedYear, discountByVendorFromYear, discountByVendorToYear]);


    const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    const textHeader = theme === 'dark' ? 'text-white' : 'text-gray-900';

    const VENDOR_COLORS_DARK = ['#a78bfa', '#7e22ce', '#581c87', '#a855f7'];
    const VENDOR_COLORS_LIGHT = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
    const vendorColors = theme === 'dark' ? VENDOR_COLORS_DARK : VENDOR_COLORS_LIGHT;

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

    return (
        <motion.div
            className="flex flex-col gap-6 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="flex flex-col md:flex-row justify-between md:items-center gap-4" variants={itemVariants}>
                <div>
                    <h1 className={`text-3xl md:text-4xl font-bold ${textHeader}`}>Dashboard</h1>
                    <p className={`mt-1 text-sm md:text-base ${textSecondary}`}>Welcome back, {user?.username || 'Admin'}!</p>
                </div>
                <motion.button
                    onClick={() => navigate('/upload')}
                    className="flex items-center gap-2 bg-violet-600 text-white font-bold py-2 px-4 md:py-3 md:px-5 rounded-xl shadow-lg transition-all transform hover:shadow-violet-400/50 focus:outline-none focus:ring-4 focus:ring-violet-500/50 text-sm md:text-base"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Plus className="w-5 h-5"/> Upload Invoice
                </motion.button>
            </motion.div>

            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" variants={itemVariants}>
                {isInitialLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
                ) : kpiError || !dashboardData?.kpiMetrics ? (
                     <div className="sm:col-span-2 lg:col-span-4 p-4 md:p-6 rounded-2xl shadow-lg border bg-red-500/10 border-red-500/20 text-red-400 flex items-center gap-3">
                        <AlertCircle className="w-6 h-6" />
                        <p className="font-semibold">Could not load key performance indicators.</p>
                    </div>
                ) : (
                    dashboardData.kpiMetrics.map((metric: KpiMetric, i: number) => (
                        <MetricCard
                            key={metric.title}
                            title={metric.title}
                            value={metric.value}
                            icon={iconMap[metric.icon] || FilePieChart} // Fallback icon
                            change={metric.change}
                            changeType={metric.changeType}
                            index={i}
                        />
                    ))
                )}
            </motion.div>

            <motion.div variants={itemVariants}>
                <DashboardStatusTable />
            </motion.div>

            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8" variants={itemVariants}>
                <ChartCard
                    title="Financial Obligations"
                    icon={Banknote}
                    isLoading={isFinancialsLoading}
                    error={financialsError}
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
                 <ChartCard
                    title="Spending by Vendor"
                    icon={TrendingUp}
                    isLoading={isSpendByVendorLoading}
                    error={spendByVendorError}
                    filterType={spendByVendorFilterType}
                    setFilterType={setSpendByVendorFilterType}
                    selectedYear={spendByVendorSelectedYear}
                    setSelectedYear={setSpendByVendorSelectedYear}
                    fromYear={spendByVendorFromYear}
                    setFromYear={setSpendByVendorFromYear}
                    toYear={spendByVendorToYear}
                    setToYear={setSpendByVendorToYear}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={spendByVendorData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} labelLine={false}>
                                {spendByVendorData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} stroke={theme === 'dark' ? '#1C1C2E' : '#fff'} strokeWidth={2} />)}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip spendByVendorData={spendByVendorData} />} />
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard
                    title="Discounts by Vendor"
                    icon={Wallet}
                    isLoading={isDiscountByVendorLoading}
                    error={discountByVendorError}
                    filterType={discountByVendorFilterType}
                    setFilterType={setDiscountByVendorFilterType}
                    selectedYear={discountByVendorSelectedYear}
                    setSelectedYear={setDiscountByVendorSelectedYear}
                    fromYear={discountByVendorFromYear}
                    setFromYear={setDiscountByVendorFromYear}
                    toYear={discountByVendorToYear}
                    setToYear={setDiscountByVendorToYear}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={discountByVendorData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} width={100} />
                            <Tooltip cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.75rem' }}/>
                            <Bar dataKey="value" name="Discount" radius={[0, 4, 4, 0]} barSize={18}>
                                {discountByVendorData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </motion.div>
        </motion.div>
    );
}

const ChartCard = ({ title, icon: Icon, children, isLoading, error, ...filterProps }: ChartCardProps) => {
    const { theme } = useTheme();
    const cardClasses = `p-4 md:p-6 rounded-2xl shadow-lg border relative ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700/50' : 'bg-white border-gray-200/80'}`;
    const textPrimary = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';

    return (
        <div className={cardClasses}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-violet-500 dark:text-violet-400" />
                    <h3 className={`text-base md:text-lg font-bold ${textPrimary}`}>{title}</h3>
                </div>
                {!error && <ChartFilterMenu {...filterProps} />}
            </div>
            <div className="h-72 md:h-80">
                {isLoading ? (
                    <ChartSkeleton />
                ) : error ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-red-400">
                         <AlertCircle className="w-12 h-12 mb-4" />
                         <p className="font-semibold">Could not load chart data</p>
                         <p className="text-sm">Please try again later.</p>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

export default Dashboard;