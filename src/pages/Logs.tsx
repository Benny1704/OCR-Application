import { useMemo, useState, useEffect, useCallback } from "react";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  FileCheck2,
  FileX2,
  ChevronDown,
  CheckCircle,
  Calendar,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getInvoiceCountStats, getLlmConsumedStats, getProcessingFailuresStats, getMonthlyProcessingStats } from "../lib/api/Api";
import ErrorDisplay from "../components/common/ErrorDisplay";
import Loader from "../components/common/Loader";

// --- CHILD COMPONENTS ---

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  Icon: React.ElementType;
  index: number;
}

const StatCard = ({ title, value, change, changeType, Icon, index }: StatCardProps) => {
    const { theme } = useTheme();
    const changeColor = changeType === 'increase' ? 'text-emerald-400' : 'text-rose-400';

    const cardVariants: Variants = {
      hidden: { opacity: 0, y: 30, scale: 0.9 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          delay: index * 0.1,
          duration: 0.6,
          ease: [0.25, 1, 0.5, 1]
        }
      }
    };
  
    return (
      <motion.div
        variants={cardVariants}
        className={`group relative overflow-hidden rounded-3xl border cursor-pointer backdrop-blur-lg
          ${theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/80 via-gray-800/40 to-gray-900/80 border-gray-700/40 hover:border-violet-500/60 hover:shadow-2xl hover:shadow-violet-500/20'
            : 'bg-gradient-to-br from-white/80 via-gray-50/40 to-white/80 border-gray-200/60 hover:border-violet-400/60 hover:shadow-xl hover:shadow-violet-500/10'
          }`}
        whileHover={{
          y: -8,
          scale: 1.03,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="relative p-6 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className={`relative p-3 rounded-xl shadow-md ${theme === 'dark' ? 'bg-gradient-to-br from-gray-700/70 to-gray-800/50' : 'bg-gradient-to-br from-gray-100 to-white'}`}>
              <Icon className="w-6 h-6 text-violet-400" />
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 text-base font-bold">
                {changeType === 'increase' ?
                  <ArrowUpRight className="w-4 h-4 text-emerald-400"/> :
                  <ArrowDownRight className="w-4 h-4 text-rose-400" />
                }
                <span className={changeColor}>{change}</span>
              </div>
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                vs last period
              </span>
            </div>
          </div>
  
          <div>
            <h4 className={`font-semibold text-lg leading-tight mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              {title}
            </h4>
            <p className={`text-5xl font-black tracking-tight leading-none bg-clip-text text-transparent ${theme === 'dark' ? 'bg-gradient-to-br from-white via-gray-100 to-gray-300' : 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600'}`}>
              {value}
            </p>
          </div>
        </div>
      </motion.div>
    );
};

const FilterDropdown = ({
  value,
  options,
  onChange,
}: {
  value: any;
  options: { name: string; value: any }[];
  onChange: (value: any) => void;
}) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-lg shadow-md hover:shadow-lg transition-all duration-300 ${theme === 'dark' ? 'border-gray-700/40 bg-gray-800/60 hover:border-violet-500/60 text-white' : 'border-gray-200/50 bg-white/60 hover:border-violet-400/60 text-gray-800'}`}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Calendar className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium">
            {options.find(opt => opt.value === value)?.name || value}
          </span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-2xl z-50 backdrop-blur-xl overflow-hidden ${theme === 'dark' ? 'border-gray-700/40 bg-gray-800/90' : 'border-gray-200/50 bg-white/90'}`}
              >
                <div className="p-1.5 max-h-60 overflow-y-auto">
                  {options.map((option) => (
                    <button
                      key={option.name}
                      onClick={() => { onChange(option.value); setIsOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                        value === option.value
                          ? `bg-violet-500/20 font-medium ${theme === 'dark' ? 'text-violet-300' : 'text-violet-600'}`
                          : `${theme === 'dark' ? 'hover:bg-gray-700/50 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`
                      }`}
                    >
                      <span>{option.name}</span>
                      {value === option.value && <CheckCircle className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    const { theme } = useTheme();
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl shadow-2xl border backdrop-blur-xl ${theme === 'dark' ? 'border-gray-700/40 bg-gray-800/90' : 'border-gray-200/50 bg-white/90'}`}
        >
          <p className="font-bold text-base mb-3 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            {label}
          </p>
          <div className="space-y-2">
            {payload.map((pld: any) => (
              <div key={pld.dataKey} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: pld.fill }} />
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{pld.name}</span>
                </div>
                <span className={`font-bold text-base ${theme === 'dark' ? 'text-violet-300' : 'text-violet-600'}`}>{pld.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }
    return null;
};

// --- MAIN COMPONENT ---

const Logs = () => {
  const { theme } = useTheme();
  const { addToast } = useToast();

  const [statsYear, setStatsYear] = useState<number>(new Date().getFullYear());
  const [statsMonth, setStatsMonth] = useState<number | undefined>(new Date().getMonth() + 1);
  const [graphYear, setGraphYear] = useState<number>(new Date().getFullYear());

  const [statsData, setStatsData] = useState<Omit<StatCardProps, 'index'>[]>([]);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isGraphLoading, setIsGraphLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  
  const fetchStatsData = useCallback(async () => {
    setIsStatsLoading(true);
    setStatsError(null);
    try {
      const [invoiceCount, llmConsumed, processingFailures] = await Promise.all([
        getInvoiceCountStats(statsYear, statsMonth),
        getLlmConsumedStats(statsYear, statsMonth),
        getProcessingFailuresStats(statsYear, statsMonth),
      ]);
      setStatsData([
        { ...invoiceCount, Icon: FileCheck2, title: "Total Invoices Processed" },
        { ...llmConsumed, Icon: BrainCircuit, title: "LLM Tokens Consumed" },
        { ...processingFailures, Icon: FileX2, title: "Processing Failures" },
      ]);
    } catch (err: any) {
      setStatsError(err.message || "Failed to fetch stats data.");
    } finally {
      setIsStatsLoading(false);
    }
  }, [statsYear, statsMonth, addToast]);

  const fetchGraphData = useCallback(async () => {
    setIsGraphLoading(true);
    setGraphError(null);
    try {
      const data = await getMonthlyProcessingStats(graphYear);
      setGraphData(data.weeklyProcessingData);
    } catch (err: any) {
      setGraphError(err.message || "Failed to fetch graph data.");
    } finally {
      setIsGraphLoading(false);
    }
  }, [graphYear, addToast]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.allSettled([fetchStatsData(), fetchGraphData()]);
      setIsInitialLoad(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isInitialLoad) fetchStatsData();
  }, [statsYear, statsMonth, isInitialLoad, fetchStatsData]);

  useEffect(() => {
    if (!isInitialLoad) fetchGraphData();
  }, [graphYear, isInitialLoad, fetchGraphData]);

  const chartColors = useMemo(() => (
    theme === 'dark' ? {
      grid: 'rgba(139, 92, 246, 0.1)',
      text: '#9ca3af',
      automated: "#8b5cf6",
      edited: "#f59e0b",
      failed: "#ef4444",
    } : {
      grid: 'rgba(139, 92, 246, 0.1)',
      text: '#6b7280',
      automated: "#7c3aed",
      edited: "#d97706",
      failed: "#dc2626",
    }
  ), [theme]);

  const years = [2023, 2024, 2025];
  const months = [
    { name: 'All Months', value: undefined },
    { name: 'January', value: 1 }, { name: 'February', value: 2 }, { name: 'March', value: 3 },
    { name: 'April', value: 4 }, { name: 'May', value: 5 }, { name: 'June', value: 6 },
    { name: 'July', value: 7 }, { name: 'August', value: 8 }, { name: 'September', value: 9 },
    { name: 'October', value: 10 }, { name: 'November', value: 11 }, { name: 'December', value: 12 },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };
  
  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader type="wifi" />
      </div>
    );
  }

  return (
    <div className={`h-full w-full overflow-y-auto`}>
      <motion.div
        className="flex flex-col gap-6 p-4 md:p-6 max-w-screen-2xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={headerVariants}>
          <h1 className={`text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Analytics
          </h1>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time insights into your invoice processing performance.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.section variants={sectionVariants} className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <TrendingUp className="w-5 h-5 text-violet-500" />
              Performance Overview
            </h2>
            <div className="flex items-center gap-2">
              <FilterDropdown value={statsYear} options={years.map(y => ({ name: y.toString(), value: y }))} onChange={setStatsYear} />
              <FilterDropdown value={statsMonth} options={months} onChange={setStatsMonth} />
            </div>
          </div>
          
          {statsError ? (
             <ErrorDisplay message={statsError} onRetry={fetchStatsData} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {isStatsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`h-40 rounded-3xl animate-pulse ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-200/50'}`} />
                    ))
                ) : (
                    statsData.map((stat, index) => (
                        <StatCard key={stat.title} {...stat} index={index} />
                    ))
                )}
            </div>
          )}
        </motion.section>

        {/* Chart Section */}
        <motion.section variants={sectionVariants} className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <Sparkles className="w-5 h-5 text-violet-500" />
                Processing Analytics
            </h2>
            <FilterDropdown value={graphYear} options={years.map(y => ({ name: `Year: ${y}`, value: y }))} onChange={setGraphYear} />
          </div>

          <div className={`p-4 sm:p-6 rounded-3xl border ${theme === 'dark' ? 'border-gray-700/60 bg-gray-900/50' : 'border-gray-200/70 bg-white/60'}`}>
            <div style={{ width: '100%', height: 320 }}>
                {isGraphLoading ? (
                    <div className="flex items-center justify-center h-full"><Loader type="dots" /></div>
                ) : graphError ? (
                    <div className="flex items-center justify-center h-full"><ErrorDisplay message={graphError} onRetry={fetchGraphData} /></div>
                ) : (
                    <ResponsiveContainer>
                        <BarChart data={graphData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAutomated" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColors.automated} stopOpacity={0.8}/><stop offset="95%" stopColor={chartColors.automated} stopOpacity={0.6}/></linearGradient>
                                <linearGradient id="colorEdited" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColors.edited} stopOpacity={0.8}/><stop offset="95%" stopColor={chartColors.edited} stopOpacity={0.6}/></linearGradient>
                                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColors.failed} stopOpacity={0.8}/><stop offset="95%" stopColor={chartColors.failed} stopOpacity={0.6}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                            <XAxis dataKey="Month" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: chartColors.text }} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: chartColors.text }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} />
                            <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "20px" }} iconType="circle" />
                            <Bar dataKey="automated" name="Automated" stackId="a" fill="url(#colorAutomated)" />
                            <Bar dataKey="edited" name="With Edits" stackId="a" fill="url(#colorEdited)" />
                            <Bar dataKey="failed" name="Failed" stackId="a" fill="url(#colorFailed)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Logs;

