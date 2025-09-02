import { useMemo, useState, Fragment, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { BrainCircuit, FileCheck2, FileX2, ChevronDown, CheckCircle } from "lucide-react";
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
import { motion } from "framer-motion";
import { Menu, Transition } from "@headlessui/react";
import { getDashboardData } from "../lib/api/Api";
import { useToast } from "../hooks/useToast";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  Icon: React.ElementType;
}

const statsData: StatCardProps[] = [
  {
    title: "Total Invoices Processed",
    value: "1,482",
    change: "+12.5%",
    changeType: "increase",
    Icon: FileCheck2,
  },
  {
    title: "LLM Tokens Consumed",
    value: "2.1M",
    change: "+8.2%",
    changeType: "increase",
    Icon: BrainCircuit,
  },
  {
    title: "Processing Failures",
    value: "31",
    change: "-3.1%",
    changeType: "decrease",
    Icon: FileX2,
  },
];

const timeRanges = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"];

const StatCard = ({ title, value, change, changeType, Icon }: StatCardProps) => {
  const { theme } = useTheme();
  const changeColor = changeType === 'increase' ? 'text-emerald-400' : 'text-rose-400';

  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      }}
      whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 300 } }}
      className={`relative p-6 rounded-2xl overflow-hidden border transition-colors ${
        theme === "dark"
          ? "bg-[#1C1C2E] border-gray-700"
          : "bg-white border-neutral-200 shadow-sm"
      }`}
    >
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_40%)]"
        initial={{ opacity: 0, scale: 0.5 }}
        whileHover={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="font-medium text-base">{title}</p>
          <Icon className="w-6 h-6 text-neutral-500" />
        </div>
        <p className="text-4xl font-bold mt-4">{value}</p>
        <div className="flex items-center gap-1 text-sm mt-1">
          <span className={changeColor}>{change}</span>
          <span className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}>
            vs last period
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  const { theme } = useTheme();
  if (active && payload && payload.length) {
    return (
      <div className={`p-4 rounded-xl shadow-lg border ${
        theme === 'dark' 
          ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700' 
          : 'bg-white/80 backdrop-blur-sm border-gray-200'
      }`}>
        <p className="font-bold text-base mb-2">{label}</p>
        {payload.map((pld: any) => (
          <div key={pld.dataKey} className="flex items-center justify-between text-sm">
            <div className="flex items-center mr-4">
              <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: pld.fill }} />
              <span>{pld.name}:</span>
            </div>
            <span className="font-semibold">{pld.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Logs = () => {
  const { theme } = useTheme();
  const [selectedRange, setSelectedRange] = useState(timeRanges[0]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        const data = await getDashboardData(addToast);
        setAnalyticsData(data);
    };
    fetchData();
  }, []);

  const chartColors = useMemo(() => (
    theme === 'dark' ? {
      grid: 'rgba(255, 255, 255, 0.1)',
      text: '#a3a3a3', // neutral-400
      automated: "url(#colorAutomatedDark)",
      edited: "url(#colorEditedDark)",
      failed: "url(#colorFailedDark)",
    } : {
      grid: 'rgba(0, 0, 0, 0.05)',
      text: '#525252', // neutral-600
      automated: "url(#colorAutomatedLight)",
      edited: "url(#colorEditedLight)",
      failed: "url(#colorFailedLight)",
    }
  ), [theme]);

  // Framer Motion container variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (!analyticsData) {
    return <div>Loading...</div>
  }

  return (
    <div
      className={`h-full w-full flex flex-col transition-colors rounded-[30px] overflow-hidden ${
        theme === "dark" ? "bg-[#1C1C2E] text-neutral-200" : "bg-gray-50 text-neutral-800"
      }`}
    >
      {/* --- HEADER --- */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className={`sticky top-0 z-20 p-4 sm:p-6 border-b transition-colors ${
          theme === "dark"
            ? "bg-[#1C1C2E] backdrop-blur-lg border-gray-700"
            : "bg-gray-50/70 backdrop-blur-lg border-gray-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoice Processing Analytics</h1>
            <p className={`mt-1 text-sm ${theme === "dark" ? "text-neutral-400" : "text-neutral-600"}`}>
              An overview of automated invoice processing performance.
            </p>
          </div>
          
          {/* --- INTERACTIVE DROPDOWN --- */}
          <Menu as="div" className="relative inline-block text-left mt-4 sm:mt-0">
            <div>
              <Menu.Button className={`inline-flex w-full justify-center items-center gap-2 px-4 py-2.5 rounded-lg border font-semibold transition-all text-sm duration-300 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700 text-neutral-200 hover:bg-gray-700 hover:border-violet-500"
                  : "bg-white border-gray-300 text-neutral-700 hover:bg-neutral-50 hover:border-violet-500"
              }`}>
                {selectedRange}
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
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
              <Menu.Items className={`absolute right-0 mt-2 w-48 origin-top-right rounded-md shadow-lg ring-1 ring-opacity-5 focus:outline-none ${
                theme === 'dark' 
                  ? 'bg-gray-800 ring-black'
                  : 'bg-white ring-black'
              }`}>
                <div className="py-1">
                  {timeRanges.map((range) => (
                    <Menu.Item key={range}>
                      {({ active }) => (
                        <button
                          onClick={() => setSelectedRange(range)}
                          className={`${
                            active ? (theme === 'dark' ? 'bg-gray-700' : 'bg-neutral-100') : ''
                          } ${
                            selectedRange === range ? 'font-bold text-violet-400' : ''
                          } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                        >
                          {range}
                          {selectedRange === range && <CheckCircle className="ml-auto h-4 w-4" />}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </motion.header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-8">
        {/* --- STATS CARDS --- */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statsData.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        </motion.section>

        {/* --- COMPARISON CHART --- */}
        <motion.section
           variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { delay: 0.3, duration: 0.5 } },
          }}
          initial="hidden"
          animate="visible"
        >
          <div className={`p-4 sm:p-6 rounded-2xl border ${
            theme === "dark"
              ? "bg-[#1C1C2E] border-gray-700"
              : "bg-white border-neutral-200 shadow-sm"
          }`}>
            <h2 className="text-lg font-semibold mb-1">Weekly Processing Breakdown</h2>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Comparison of invoices processed automatically, with edits, or failed.
            </p>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={analyticsData.weeklyProcessingData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  {/* --- GRADIENT DEFINITIONS FOR BARS --- */}
                  <defs>
                    <linearGradient id="colorAutomatedDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorEditedDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorFailedDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorAutomatedLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="colorEditedLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.4}/>
                    </linearGradient>
                     <linearGradient id="colorFailedLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: theme === 'dark' ? 'rgba(163, 163, 163, 0.1)' : 'rgba(39, 39, 42, 0.1)' }}
                    content={<CustomTooltip />}
                  />
                  <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}}/>
                  <Bar dataKey="automated" name="Automated" stackId="a" fill={chartColors.automated} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="edited" name="With Edits" stackId="a" fill={chartColors.edited} />
                  <Bar dataKey="failed" name="Failed (Manual)" stackId="a" fill={chartColors.failed} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Logs;