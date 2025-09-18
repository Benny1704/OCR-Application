import React, { useEffect, useState, Fragment, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line, Cell, PieChart, Pie, Legend } from 'recharts';
import { Plus, Banknote, FilePieChart, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, MoreVertical, FileDiff } from 'lucide-react';
import { Menu, Transition, Switch } from "@headlessui/react";
import DashboardStatusTable from '../components/common/DashboardStatusTable';
import { useAuth } from '../hooks/useAuth';
import { getTotalDiscountThisMonth, getTotalSpendThisMonth, getFinancialObligations, getInvoiceCount, getSpendByVendor, getDiscountByVendor, getDocumentSummary } from '../lib/api/Api';
import { useToast } from '../hooks/useToast';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Loader from '../components/common/Loader';

const iconMap: { [key: string]: React.ElementType } = {
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
        <div
            className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/40 hover:border-violet-500/50'
                    : 'bg-gradient-to-br from-white to-gray-50/70 border border-gray-200/60 hover:border-violet-400/50'
            } hover:shadow-xl hover:shadow-violet-500/15`}
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
        </div>
    );
};

const VendorChartFilterMenu = ({ selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, topN, setTopN }: any) => {
    const { theme } = useTheme();
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
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
                            <select
                                value={topN}
                                onChange={(e) => setTopN(parseInt(e.target.value))}
                                className={`block w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
                                    theme === 'dark'
                                        ? 'border-gray-600 bg-gray-700/80 text-gray-200'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                {topNOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                Year
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className={`block w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
                                    theme === 'dark'
                                        ? 'border-gray-600 bg-gray-700/80 text-gray-200'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                {years.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                Month
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className={`block w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
                                    theme === 'dark'
                                        ? 'border-gray-600 bg-gray-700/80 text-gray-200'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
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
    const { theme } = useTheme();
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

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
                            <div className="px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                        View Mode
                                    </span>
                                    <Switch
                                        checked={filterType === 'yearly'}
                                        onChange={() => setFilterType(filterType === 'monthly' ? 'yearly' : 'monthly')}
                                        className={`${filterType === 'yearly' ? 'bg-violet-600' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                                    >
                                        <span className={`${filterType === 'yearly' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                    </Switch>
                                </div>
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {filterType === 'yearly' ? 'Yearly Range' : 'Monthly View'}
                                </p>
                            </div>
                                    {filterType === 'monthly' ? (
                                        <div className="px-4 py-3">
                                            <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                                Year
                                            </label>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                className={`block w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
                                                    theme === 'dark'
                                                        ? 'border-gray-600 bg-gray-700/80 text-gray-200'
                                                        : 'border-gray-300 bg-white text-gray-900'
                                                }`}
                                            >
                                                {years.map(year => <option key={year} value={year}>{year}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 space-y-3">
                                            <div>
                                                <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                                    From Year
                                                </label>
                                                <select
                                                    value={fromYear}
                                                    onChange={(e) => setFromYear(parseInt(e.target.value))}
                                                    className={`block w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
                                                        theme === 'dark'
                                                            ? 'border-gray-600 bg-gray-700/80 text-gray-200'
                                                            : 'border-gray-300 bg-white text-gray-900'
                                                    }`}
                                                >
                                                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                                                    To Year
                                                </label>
                                                <select
                                                    value={toYear}
                                                    onChange={(e) => setToYear(parseInt(e.target.value))}
                                                    className={`block w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
                                                        theme === 'dark'
                                                            ? 'border-gray-600 bg-gray-700/80 text-gray-200'
                                                            : 'border-gray-300 bg-white text-gray-900'
                                                    }`}
                                                >
                                                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                                                </select>
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

const ChartCard = ({ title, icon: Icon, children, isLoading, error, onRetry, data, isVendorChart = false, fullWidth = false, ...filterProps }: ChartCardProps) => {
    const { theme } = useTheme();
    const hasData = data && data.length > 0;

    return (
        <div
            className={`relative p-6 rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${
                theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-gray-700/40 hover:border-gray-600/60'
                    : 'bg-gradient-to-br from-white/90 to-gray-50/50 border-gray-200/50 hover:border-gray-300/70'
            } ${fullWidth ? 'lg:col-span-2' : ''}`}
        >
            <div className="relative z-20 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                        theme === 'dark'
                            ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/40'
                            : 'bg-gradient-to-br from-gray-100 to-white'
                    } shadow-md`}>
                        <Icon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                    </div>
                    <h3 className={`text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        {title}
                    </h3>
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
                    <div className="w-full h-full flex items-center justify-center">
                        <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            No data found
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    if ((percent * 100) < 5) { // Only show line for small percentages
        return (
            <g>
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={"#999"} fill="none" />
                <circle cx={ex} cy={ey} r={2} fill={"#999"} stroke="none" />
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#999" fontSize={12}>
                    {`${payload.name} ${(percent * 100).toFixed(0)}%`}
                </text>
            </g>
        );
    }

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
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
    const [spendByVendorTopN, setSpendByVendorTopN] = useState<number>(10);

    const [discountByVendorSelectedYear, setDiscountByVendorSelectedYear] = useState<number>(new Date().getFullYear());
    const [discountByVendorSelectedMonth, setDiscountByVendorSelectedMonth] = useState<number>(0);
    const [discountByVendorTopN, setDiscountByVendorTopN] = useState<number>(10);

    const fetchInitialData = useCallback(async () => {
        try {
            const [spendResponse, discountResponse] = await Promise.all([
                getTotalSpendThisMonth(addToast),
                getTotalDiscountThisMonth(addToast),
                getDocumentSummary(addToast)
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
    }, []);

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
    }, [spendByVendorSelectedYear, spendByVendorSelectedMonth, spendByVendorTopN]);

    const fetchDiscountByVendor = useCallback(async () => {
        setIsDiscountByVendorLoading(true);
        setDiscountByVendorError(null);
        try {
            const discountData = await getDiscountByVendor(discountByVendorSelectedYear, discountByVendorSelectedMonth || undefined);
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
    }, [discountByVendorSelectedYear, discountByVendorSelectedMonth, discountByVendorTopN]);

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

    const renderSpendChart = () => {
        const processedData = spendByVendorData.map(item => ({
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
                        cx="35%"
                        cy="50%"
                        outerRadius="80%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                    >
                        {processedData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={(value) => formatTooltipIndianCurrency(value)} />} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    const renderDiscountChart = () => {
        const processedData = discountByVendorData.map(item => ({
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
                        cx="35%"
                        cy="50%"
                        outerRadius="80%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                    >
                        {processedData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={(value) => `${value.toFixed(2)}%`} />} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div
            className="flex flex-col gap-6"
        >
            {/* Header Section */}
            <div
                className="flex flex-col md:flex-row justify-between md:items-center gap-4"
            >
                <div>
                    <h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${textHeader} mb-2`}>
                        Insights
                    </h1>
                    <p className={`text-sm ${textSecondary}`}>
                        Welcome back, <span className="font-medium text-violet-500">{user?.username || 'Admin'}</span>!
                        Here's your business insights.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/upload')}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/25 focus:outline-none focus:ring-4 focus:ring-violet-500/50 text-sm group"
                >
                    <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300"/>
                    <span>Upload Invoice</span>
                </button>
            </div>

            {/* KPI Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            {/* Status Table Section */}
            <div>
                <DashboardStatusTable />
            </div>

            {/* Financial Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Invoice Amount"
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
            </div>

            {/* Vendor Charts Section - Same Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Spending by Vendor"
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
            </div>
        </div>
    );
}

export default Dashboard;