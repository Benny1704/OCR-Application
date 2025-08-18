import { HardDriveUpload, RefreshCw, FileCheck2, CheckCircle2 } from 'lucide-react';
import React from 'react'
import { useTheme } from '../../hooks/useTheme';
import type { Page } from '../../interfaces/Types';
import { useNavigate } from 'react-router';

const ProcessStepper = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const steps = [
        { name: 'Upload', icon: HardDriveUpload, page: 'upload' as Page },
        { name: 'Processing', icon: RefreshCw, page: 'queue' as Page },
        { name: 'Verification', icon: FileCheck2, page: 'edit' as Page },
        { name: 'Complete', icon: CheckCircle2, page: 'dashboard' as Page },
    ];

    return (
        <div className={`p-6 rounded-2xl shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-white border-gray-200/80'}`}>
            <h3 className={`font-bold text-lg mb-5 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Our Process</h3>
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.name}>
                        <div className="flex flex-col items-center text-center">
                            <button
                                onClick={() => navigate(step.page)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all hover:scale-110 ${theme === 'dark' ? 'bg-gray-700 text-violet-400 hover:bg-violet-900/50' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'}`}
                                title={`Go to ${step.name}`}
                            >
                                <step.icon className="w-6 h-6" />
                            </button>
                            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{step.name}</span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProcessStepper
