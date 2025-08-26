import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { monthlyExpenseData, invoiceVolumeData, discountByVendorData, spendByVendorData } from '../lib/MockData';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line, Cell, Legend, Pie, PieChart } from 'recharts';
import { Plus, Banknote, FilePieChart, FileDiff, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, MoreVertical, Settings, Download } from 'lucide-react';
import { motion, type Variants } from "framer-motion"; // <-- IMPORT THE TYPE HERE
import { Menu, Transition } from "@headlessui/react";
import DashboardStatusTable from '../components/common/DashboardStatusTable';
import { useAuth } from '../hooks/useAuth';
import { itemVariants } from '../components/common/Animation';
import { containerVariants } from '../components/common/Animation';

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
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
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

    const cardVariants: Variants = { // <-- ADDED TYPE ANNOTATION
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { delay: index * 0.1, duration: 0.5, ease: "easeOut" } }
    };

    return (
        <motion.div variants={cardVariants} className={cardClasses}>
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

const DropdownMenu = () => (
    <Menu as="div" className="relative inline-block text-left">
        <div>
            <Menu.Button className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                <MoreVertical className="w-5 h-5" />
            </Menu.Button>
        </div>
        <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
        >
            <Menu.Items className="absolute right-0 w-48 mt-2 origin-top-right bg-white dark:bg-[#2a2a3e] divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                <div className="px-1 py-1 ">
                    <Menu.Item>
                        {({ active }) => (
                            <button className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900 dark:text-gray-200'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>
                                <Download className="w-5 h-5 mr-2" aria-hidden="true" /> Download
                            </button>
                        )}
                    </Menu.Item>
                    <Menu.Item>
                        {({ active }) => (
                            <button className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900 dark:text-gray-200'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>
                                <Settings className="w-5 h-5 mr-2" aria-hidden="true" /> Settings
                            </button>
                        )}
                    </Menu.Item>
                </div>
            </Menu.Items>
        </Transition>
    </Menu>
);

const CustomPieTooltip = ({ active, payload }: CustomTooltipProps) => {
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


// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

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

    const kpiMetrics: Omit<MetricCardProps, 'index'>[] = [
        { title: "Total Discounts", value: "₹23,316", icon: Wallet, change: "5.2%", changeType: "increase" },
        { title: "Invoice Exceptions", value: "14", icon: FileDiff, change: "2.1%", changeType: "decrease" },
        { title: "Avg. Processing Time", value: "2.1 Days", icon: Banknote, change: "8.0%", changeType: "increase" },
        { title: "Total Spend (MTD)", value: "₹1,84,920", icon: TrendingUp, change: "12.5%", changeType: "increase" }
    ];

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
                    <p className={`mt-1 text-sm md:text-base ${textSecondary}`}>Welcome back, {user?.email || 'Admin'}!</p>
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
                {kpiMetrics.map((metric, i) => (
                    <MetricCard key={metric.title} {...metric} index={i} />
                ))}
            </motion.div>

            <motion.div variants={itemVariants}>
                <DashboardStatusTable />
            </motion.div>

            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8" variants={itemVariants}>
                <ChartCard title="Financial Obligations" icon={Banknote}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyExpenseData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.75rem' }}/>
                            <Bar dataKey="expense" fill="url(#expenseGradient)" name="Expense" radius={[4, 4, 0, 0]} barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Invoice Count" icon={FilePieChart}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={invoiceVolumeData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                             <defs>
                                <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{stroke: 'rgba(139, 92, 246, 0.2)', strokeWidth: 2}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.75rem' }}/>
                            <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: theme === 'dark' ? '#1C1C2E' : '#fff' }} activeDot={{ r: 8 }} name="Invoices" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Spending by Vendor" icon={TrendingUp}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={spendByVendorData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} labelLine={false}>
                                {spendByVendorData.map((entry, index) => <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} stroke={theme === 'dark' ? '#1C1C2E' : '#fff'} strokeWidth={2} />)}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Discounts by Vendor" icon={Wallet}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={discountByVendorData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} width={100} />
                            <Tooltip cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.75rem' }}/>
                            <Bar dataKey="value" name="Discount" radius={[0, 4, 4, 0]} barSize={18}>
                                {discountByVendorData.map((entry, index) => <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </motion.div>
        </motion.div>
    );
}

const ChartCard = ({ title, icon: Icon, children }: ChartCardProps) => {
    const { theme } = useTheme();
    const cardClasses = `p-4 md:p-6 rounded-2xl shadow-lg border ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700/50' : 'bg-white border-gray-200/80'}`;
    const textPrimary = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';

    return (
        <div className={cardClasses}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-violet-500 dark:text-violet-400" />
                    <h3 className={`text-base md:text-lg font-bold ${textPrimary}`}>{title}</h3>
                </div>
                <DropdownMenu />
            </div>
            <div className="h-72 md:h-80">
                {children}
            </div>
        </div>
    );
};

export default Dashboard;