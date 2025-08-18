import { useNavigate } from "react-router";
import { useTheme } from "../hooks/useTheme";
import { mockLogs } from "../lib/MockData";

const Logs = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
    return (
        <div className={`p-6 sm:p-8 rounded-2xl shadow-lg border animate-fade-in-up transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`}>
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Activity Logs</h2>
            <div className={`overflow-x-auto rounded-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <table className="w-full text-sm text-left">
                    <thead className={`text-xs uppercase ${theme === 'dark' ? 'text-gray-400 bg-gray-900/50' : 'text-gray-600 bg-gray-100'}`}>
                        <tr>
                            <th scope="col" className="px-6 py-4 font-semibold">Timestamp</th>
                            <th scope="col" className="px-6 py-4 font-semibold">User</th>
                            <th scope="col" className="px-6 py-4 font-semibold">Action</th>
                            <th scope="col" className="px-6 py-4 font-semibold">Details</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {mockLogs.map(log => (
                            <tr key={log.id} className={`transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700/50' : 'bg-white hover:bg-gray-50/70'}`}>
                                <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{log.timestamp}</td>
                                <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{log.user}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${log.action.includes('SUCCESS') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : log.action.includes('VERIFIED') ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300' : 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300'}`}>{log.action}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Logs