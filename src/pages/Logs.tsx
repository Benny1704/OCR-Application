import { useState, useMemo, type ChangeEvent } from "react";
import {
  FileUp,
  CheckCircle2,
  ShieldCheck,
  XCircle,
  Search,
  ChevronDown,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";

// --- TYPE DEFINITIONS ---
interface Log {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

interface ActionStyle {
  Icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

// --- MOCK DATA ---
const mockLogs: Log[] = [
    {
    id: 1,
    // Note: To make "Today" and "Yesterday" work, the current date is assumed to be Aug 20, 2025
    timestamp: "2025-08-20 10:45:12",
    user: "admin@example.com",
    action: "UPLOAD_SUCCESS",
    details: "Uploaded document 'Financial_Report_Q3.pdf'",
  },
  {
    id: 2,
    timestamp: "2025-08-20 10:42:05",
    user: "john.doe@example.com",
    action: "VERIFICATION_PENDING",
    details: "Document 'Project_Proposal_V4.docx' is awaiting verification.",
  },
  {
    id: 3,
    timestamp: "2025-08-19 09:15:33",
    user: "jane.smith@example.com",
    action: "PROCESSING_FAILED",
    details: "Failed to process 'Marketing_Images.zip'. Error: File corrupted.",
  },
  {
    id: 4,
    timestamp: "2025-08-19 16:20:48",
    user: "admin@example.com",
    action: "USER_AUTHENTICATED",
    details: "User successfully authenticated via SSO.",
  },
  {
    id: 5,
    timestamp: "2025-08-18 14:05:19",
    user: "john.doe@example.com",
    action: "UPLOAD_SUCCESS",
    details: "Uploaded document 'Client_Contract_Signed.pdf'",
  },
  {
    id: 6,
    timestamp: "2025-08-18 11:55:01",
    user: "system",
    action: "VERIFICATION_SUCCESS",
    details: "Document 'Onboarding_Form_Final.pdf' was automatically verified.",
  },
];

// --- HELPER FUNCTIONS ---

const getActionStyle = (action: string, theme: string): ActionStyle => {
  const isDark = theme === "dark";
  switch (action) {
    case "UPLOAD_SUCCESS":
      return {
        Icon: FileUp,
        color: isDark ? "text-sky-400" : "text-sky-600",
        bg: isDark ? "bg-sky-900/40" : "bg-sky-100",
        label: "Upload",
      };
    case "VERIFICATION_SUCCESS":
    case "USER_AUTHENTICATED":
      return {
        Icon: CheckCircle2,
        color: isDark ? "text-emerald-400" : "text-emerald-600",
        bg: isDark ? "bg-emerald-900/40" : "bg-emerald-100",
        label: "Success",
      };
    case "PROCESSING_FAILED":
      return {
        Icon: XCircle,
        color: isDark ? "text-red-400" : "text-red-600",
        bg: isDark ? "bg-red-900/40" : "bg-red-100",
        label: "Failed",
      };
    case "VERIFICATION_PENDING":
      return {
        Icon: ShieldCheck,
        color: isDark ? "text-amber-400" : "text-amber-600",
        bg: isDark ? "bg-amber-900/40" : "bg-amber-100",
        label: "Pending",
      };
    default:
      return {
        Icon: FileUp,
        color: isDark ? "text-gray-400" : "text-gray-600",
        bg: isDark ? "bg-gray-800" : "bg-gray-200",
        label: "Generic",
      };
  }
};

const formatDateHeader = (dateString: string): string => {
    const logDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    logDate.setHours(0, 0, 0, 0);

    if (logDate.getTime() === today.getTime()) {
        return "Today";
    }
    if (logDate.getTime() === yesterday.getTime()) {
        return "Yesterday";
    }

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(dateString));
};


// --- LOGS COMPONENT ---
const Logs = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredLogs = useMemo(() => mockLogs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm]);

  const groupedLogs = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      const date = log.timestamp.split(" ")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {} as Record<string, Log[]>);
  }, [filteredLogs]);

  const sortedDates = useMemo(() => 
    Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), 
    [groupedLogs]
  );

  return (
    <div
      className={`h-full w-full flex flex-col transition-colors rounded-2xl overflow-hidden ${
        theme === "dark" ? "bg-[#1C1C2E] text-gray-200" : "bg-gray-50 text-gray-900"
      }`}
    >
      <header
        className={`sticky top-0 z-10 p-4 sm:p-6 border-b transition-colors ${
          theme === "dark"
            ? "bg-[#1C1C2E] backdrop-blur-sm border-gray-800"
            : "bg-gray-50/80 backdrop-blur-sm border-gray-200"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            An overview of all recent activities in the system.
          </p>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="Search logs by user, action, or details..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className={`w-full pl-11 pr-4 py-2.5 rounded-lg border transition-colors focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none ${
                theme === "dark"
                  ? "bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
              }`}
            />
          </div>
          <button
            className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-lg border font-semibold transition-colors ${
              theme === "dark"
                ? "bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Filter by Action</span>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 sm:p-6">
        {filteredLogs.length > 0 ? (
          <div className="space-y-8">
            {sortedDates.map((date) => {
              const logsForDate = groupedLogs[date];
              return (
                <section key={date}>
                  <h2 className="text-sm font-semibold mb-3">
                    {formatDateHeader(date)}
                  </h2>
                  {/*// ANCHOR - This is the change you requested. */}
                  <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                    {logsForDate.map((log, index) => {
                      const { Icon, color, bg, label } = getActionStyle(log.action, theme);
                      return (
                        <div
                          key={log.id}
                          className={`flex items-start gap-4 p-4 transition-colors ${index < logsForDate.length - 1 ? (theme === 'dark' ? 'border-b border-gray-800' : 'border-b border-gray-200') : ''}`}
                        >
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${bg} ${color}`}
                          >
                            <Icon size={20} />
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium">{log.details}</p>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm mt-1">
                              <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                                {log.user}
                              </span>
                              <span className={theme === "dark" ? "text-gray-600" : "text-gray-400"}>•</span>
                              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${bg} ${color}`}>
                                {label}
                              </span>
                            </div>
                          </div>
                          <p className={`flex-shrink-0 text-sm font-mono pt-0.5 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                            {log.timestamp.split(" ")[1]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
             <div className={`p-4 rounded-full mb-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <SearchX size={32} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}/>
             </div>
            <p className="text-lg font-semibold">No Logs Found</p>
            <p className={`text-sm mt-1 max-w-sm ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
              Your search for "{searchTerm}" did not return any results. Try a different keyword.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Logs;