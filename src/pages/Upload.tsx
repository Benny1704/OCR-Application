import { HardDriveUpload } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router';

const Upload = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
    const handleProceed = () => {
        navigate('/queue');
    };
    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className={`p-8 rounded-2xl shadow-lg text-center border transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`}>
                <h2 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Upload Your Document</h2>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-8`}>Drag & drop files or click to browse. Supports PDF, PNG, JPG.</p>
                <div className={`border-2 border-dashed rounded-xl p-12 cursor-pointer transition-colors duration-300 ${theme === 'dark' ? 'border-gray-600 hover:border-violet-500 hover:bg-gray-700/50' : 'border-gray-300 hover:border-violet-500 hover:bg-violet-50'}`}>
                    <div className={`flex flex-col items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <HardDriveUpload className="w-16 h-16 mb-4"/>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Click to upload or drag and drop</p>
                        <p className="text-sm">PDF, PNG, JPG (max. 10MB)</p>
                    </div>
                </div>
                <button onClick={handleProceed} className="mt-8 w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg hover:shadow-purple-500/40">
                    Upload and Proceed
                </button>
            </div>
        </div>
    );
}

export default Upload