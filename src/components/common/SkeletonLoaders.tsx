// src/components/common/SkeletonLoaders.tsx
import React from 'react';
import { useTheme } from '../../hooks/useTheme';

export const KpiCardSkeleton = () => {
    const { theme } = useTheme();
    return (
        <div className={`p-4 md:p-6 rounded-2xl shadow-lg border ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700/50' : 'bg-white border-gray-200/80'}`}>
            <div className="animate-pulse flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className={`h-4 w-2/3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <div className={`h-6 w-6 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                </div>
                <div className={`h-8 w-1/2 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                <div className={`h-4 w-full rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>
        </div>
    );
};

export const ChartSkeleton = () => {
    const { theme } = useTheme();
    return (
         <div className="animate-pulse w-full h-full flex items-end justify-between p-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`w-4 rounded-t-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} style={{ height: `${Math.random() * 80 + 10}%` }}></div>
            ))}
        </div>
    );
};

export const QueueListSkeleton = () => {
    const { theme } = useTheme();
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow overflow-hidden">
             <aside className={`rounded-xl border flex flex-col ${ theme === "dark" ? "bg-gray-800/20" : "bg-white" } ${theme === "dark" ? "border-gray-700/80" : "border-gray-200/80"}`}>
                <div className={`p-3 border-b ${theme === "dark" ? "border-gray-700/80" : "border-gray-200/80"}`}>
                     <div className={`h-5 w-3/5 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                </div>
                <div className="flex-grow p-2 space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse w-full p-2.5 rounded-lg flex items-center gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                            <div className="flex-1 overflow-hidden space-y-2">
                                <div className={`h-4 w-4/5 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                            </div>
                             <div className={`h-5 w-16 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                        </div>
                    ))}
                </div>
            </aside>
             <section className={`lg:col-span-2 rounded-xl border flex flex-col ${ theme === "dark" ? "bg-gray-800/20" : "bg-white" } ${theme === "dark" ? "border-gray-700/80" : "border-gray-200/80"}`}>
                 <div className="h-full flex flex-col p-4 animate-pulse">
                    <div className="flex justify-between items-start pb-4 flex-shrink-0">
                        <div className="flex-1 overflow-hidden pr-4 space-y-2">
                             <div className={`h-6 w-3/4 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                             <div className={`h-3 w-1/2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                        </div>
                         <div className={`h-8 w-24 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    </div>
                    <hr className={`flex-shrink-0 ${theme === "dark" ? "border-gray-700/80" : "border-gray-200/80"}`} />
                    <div className="py-4 space-y-6 flex-grow">
                        <div className='space-y-3'>
                             <div className={`h-5 w-1/3 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                 <div className={`h-16 w-full rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-300/50'}`}></div>
                                 <div className={`h-16 w-full rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-300/50'}`}></div>
                             </div>
                        </div>
                    </div>
                     <hr className={`flex-shrink-0 ${theme === "dark" ? "border-gray-700/80" : "border-gray-200/80"}`} />
                     <div className="pt-4 flex-shrink-0 space-y-3">
                         <div className={`h-5 w-1/4 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                         <div className="flex flex-wrap items-center gap-2">
                             <div className={`h-8 w-24 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                             <div className={`h-8 w-24 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                         </div>
                    </div>
                </div>
            </section>
        </div>
    );
}