import { AlertTriangle, RotateCw, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ErrorHandlerProps {
    errorMessage: string;
    onRetry?: () => void;
    onGoBack?: () => void;
}

const ErrorHandler = ({ errorMessage, onRetry, onGoBack }: ErrorHandlerProps) => {
    const { theme } = useTheme();

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleGoBack = () => {
        if (onGoBack) {
            onGoBack();
        } else {
            window.history.back();
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center h-full p-4 rounded-2xl ${theme === 'dark' ? 'bg-[#1C1C2E] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    An Error Occurred
                </h2>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {errorMessage || "Something went wrong. Please try again later."}
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleGoBack}
                        className={`flex items-center gap-2 font-semibold py-2 px-4 text-sm rounded-lg transition-colors border shadow-sm ${theme === 'dark' ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                        <ArrowLeft size={16} /> Go Back
                    </button>
                    <button
                        onClick={onRetry || handleRefresh}
                        className="flex items-center gap-2 bg-violet-600 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-violet-700"
                    >
                        <RotateCw size={16} /> {onRetry ? 'Retry' : 'Refresh'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorHandler;