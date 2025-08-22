import React, { type FC, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { monthlyExpenseData, invoiceVolumeData, discountByVendorData, expensesData, spendByVendorData } from '../lib/MockData';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line, Area, AreaChart, Cell, Legend, Pie, PieChart } from 'recharts';
import { Plus, Banknote, FilePieChart, FileDiff, AlertTriangle, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import DashboardStatusTable from '../components/common/DashboardStatusTable';
import { useAuth } from '../hooks/useAuth';

// A new, reusable Metric Card for the KPI row
const MetricCard: FC<{ title: string, value: string, icon: React.ElementType, change?: string, changeType?: 'increase' | 'decrease' }> = ({ title, value, icon: Icon, change, changeType }) => {
    const { theme } = useTheme();
    const cardClasses = `p-6 rounded-2xl shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`;
    const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className={cardClasses}>
            <div className="flex justify-between items-start">
                <h3 className={`text-md font-semibold ${textSecondary}`}>{title}</h3>
                <Icon className="w-6 h-6 text-gray-400" />
            </div>
            <p className={`text-3xl font-bold mt-2 ${textPrimary}`}>{value}</p>
            {change && (
                <div className="flex items-center mt-2">
                    {changeType === 'increase' ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                    <p className={`ml-1 text-sm ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>{change}</p>
                    <p className={`ml-1 text-sm ${textSecondary}`}>vs last month</p>
                </div>
            )}
        </div>
    );
};


const Dashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    const cardClasses = `p-6 rounded-2xl shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`;
    const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-800';
    const textHeader = theme === 'dark' ? 'text-white' : 'text-gray-900';
    
    const VENDOR_COLORS_DARK = ['#a78bfa', '#7e22ce', '#581c87', '#a855f7'];
    const VENDOR_COLORS_LIGHT = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
    const vendorColors = theme === 'dark' ? VENDOR_COLORS_DARK : VENDOR_COLORS_LIGHT;

    const ChartCard: FC<{title: string, icon: React.ElementType, children: ReactNode}> = ({title, icon: Icon, children}) => (
        <div className={cardClasses}>
            <div className="flex items-center gap-3 mb-4">
                <Icon className="w-6 h-6 text-violet-500 dark:text-violet-400" />
                <h3 className={`text-lg font-bold ${textPrimary}`}>{title}</h3>
            </div>
            <div className="h-56">
                {children}
            </div>
        </div>
    );

    if (user?.role !== 'admin') { /* ... (Access Denied code remains the same) ... */ }

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up">
            {/* --- ROW 1: Header --- */}
            <div className="flex justify-between items-center">
                <h1 className={`text-3xl font-bold ${textHeader}`}>Dashboard</h1>
                <button onClick={() => navigate('/upload')} className="flex items-center gap-2 bg-violet-600 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-violet-500/50">
                    <Plus className="w-5 h-5"/> Upload Invoice
                </button>
            </div>

            {/* --- ROW 2: KPI Metrics --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Discounts" value="₹23,316" icon={Wallet} change="5.2%" changeType="increase" />
                <MetricCard title="Invoice Exceptions" value="14" icon={FileDiff} change="2.1%" changeType="decrease" />
                <MetricCard title="Avg. Processing Time" value="2.1 Days" icon={Banknote} change="8.0%" changeType="increase" />
                <MetricCard title="Total Spend (MTD)" value="₹1,84,920" icon={TrendingUp} change="12.5%" changeType="increase" />
            </div>

            {/* --- ROW 3: Document Status Overview --- */}
            <DashboardStatusTable />

            {/* --- ROW 4: Visualizations / Charts --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartCard title="Financial Obligations" icon={Banknote}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyExpenseData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.75rem' }}/>
                            <Bar dataKey="expense" fill="#a78bfa" name="Expense" radius={[4, 4, 0, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Invoice Count" icon={FilePieChart}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={invoiceVolumeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{stroke: 'rgba(139, 92, 246, 0.2)', strokeWidth: 2}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.75rem' }}/>
                            <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Invoices" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Spending by Vendor" icon={TrendingUp}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={spendByVendorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {spendByVendorData.map((entry, index) => <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.75rem' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Discounts by Vendor" icon={Wallet}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={discountByVendorData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} width={100} />
                            <Tooltip cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.75rem' }}/>
                            <Bar dataKey="value" name="Discount" radius={[0, 4, 4, 0]} barSize={16}>
                            {discountByVendorData.map((entry, index) => <Cell key={`cell-${index}`} fill={vendorColors[index % vendorColors.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                
                {/* <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
                    <p className="text-lg font-medium">Total Discounts</p>
                    <p className="text-4xl font-bold mt-1">₹23,316</p>
                    <div className="h-24 -mx-6 -mb-6 mt-4">
                         <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={expensesData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                  <defs> <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4}/> <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/> </linearGradient> </defs>
                                  <Tooltip contentStyle={{ display: 'none' }} cursor={false} />
                                  <Area type="monotone" dataKey="uv" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                              </AreaChart>
                         </ResponsiveContainer>
                    </div>
                </div> */}
            </div>
        </div>
    );
}

export default Dashboard;