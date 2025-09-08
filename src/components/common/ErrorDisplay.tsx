import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

const ErrorDisplay = ({ message, onRetry }: ErrorDisplayProps) => {
  const { theme } = useTheme();
  const textHeader = theme === "dark" ? "text-white" : "text-gray-900";
  // const borderPrimary = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  // const bgCard = theme === 'dark' ? 'bg-gray-800/50' : 'bg-white';

  return (
    <div className={`rounded-xl p-6 flex flex-col items-center justify-center text-center`}>
      <AlertCircle className={`w-12 h-12 mb-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
      <p className={`font-semibold text-base mb-2 ${textHeader}`}>
        An Error Occurred
      </p>
      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        {message}
      </p>
      <button
        onClick={onRetry}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === 'dark' ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-violet-500 hover:bg-violet-600 text-white'}`}
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
};

export default ErrorDisplay;