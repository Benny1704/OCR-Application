// src/components/Upload.tsx

import { HardDriveUpload, FileText, X, Eye, Paperclip, Info, Files, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { useTheme } from '../hooks/useTheme';

// TODO: Replace this with your preferred toast library (e.g., react-hot-toast)
const showToast = (message: string) => {
    alert(message);
};

const Upload = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);

    const MAX_FILES = 5;

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.filter(newFile => 
            !files.some(existingFile => 
                existingFile.name === newFile.name && existingFile.size === newFile.size
            )
        );

        if (files.length + newFiles.length > MAX_FILES) {
            showToast(`You can select a maximum of ${MAX_FILES} files.`);
        }
        
        // Add all newly selected, non-duplicate files to the list
        setFiles(prevFiles => [...prevFiles, ...newFiles]);

    }, [files]);
    
    const acceptOptions: Accept = {
        'application/pdf': ['.pdf'],
        'image/png': ['.png'],
        'image/jpeg': ['.jpg', '.jpeg'],
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptOptions,
        maxSize: 10 * 1024 * 1024, // 10 MB
        // REMOVED maxFiles from here to handle the logic manually in onDrop
    });

    const removeFile = (fileName: string): void => {
        setFiles(files.filter(file => file.name !== fileName));
    };
    
    const handleProceed = (): void => {
        console.log("Proceeding with files:", files);
        navigate('/queue');
    };

    const formatBytes = (bytes: number, decimals: number = 2): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const isOverLimit = files.length > MAX_FILES;

    return (
        <div className={`h-full w-full flex flex-col p-4 sm:p-6 transition-colors animate-fade-in-up rounded-2xl overflow-hidden ${theme === "dark" ? "bg-[#1C1C2E] text-gray-200" : "bg-gray-50 text-gray-900"}`}>
            {/* --- HEADER --- */}
            <header className="flex-shrink-0 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-2.5 rounded-lg shadow-lg">
                        <Paperclip className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Document Upload</h1>
                        <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Upload up to {MAX_FILES} files to get started.
                        </p>
                    </div>
                </div>
            </header>

            {/* --- MAIN CONTENT GRID --- */}
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-8 min-h-0">
                
                {/* --- LEFT COLUMN: UPLOAD ZONE --- */}
                <div className="lg:col-span-3 flex flex-col gap-8">
                    <div {...getRootProps()} className={`relative flex-grow flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300 group ${theme === 'dark' ? 'border-gray-700 hover:border-violet-500' : 'border-gray-300 hover:border-violet-500'} ${isDragActive ? (theme === 'dark' ? 'border-violet-500 bg-violet-900/20' : 'border-violet-500 bg-violet-50') : (theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-100/50')}`}>
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center text-center text-gray-500 group-hover:text-violet-500 transition-colors">
                            <HardDriveUpload className="w-16 h-16 mb-4 transition-transform duration-300 group-hover:scale-110" />
                            <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                {isDragActive ? "Drop files here..." : "Click to upload or drag and drop"}
                            </p>
                            <p className="text-sm mt-1">Maximum {MAX_FILES} files</p>
                        </div>
                    </div>

                    <div className={`flex-shrink-0 p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                            <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />
                            <h4 className="font-bold">File Guidelines</h4>
                        </div>
                        <ul className={`list-disc list-inside space-y-1.5 text-sm mt-3 pl-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <li>Max file size: **10MB** per file</li>
                            <li>Accepted formats: **PDF, PNG, JPG/JPEG**</li>
                        </ul>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: FILE LIST & ACTIONS --- */}
                <div className={`lg:col-span-2 flex flex-col rounded-lg border min-h-0 ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                    {files.length > 0 ? (
                        <>
                            <div className="p-4 border-b border-inherit flex-shrink-0">
                                <h3 className="font-semibold text-lg">
                                    Selected Files (
                                    <span className={isOverLimit ? 'text-red-500 font-bold' : ''}>{files.length}</span>
                                    /{MAX_FILES})
                                </h3>
                                {isOverLimit && (
                                    <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Please remove files to meet the {MAX_FILES} file limit.</span>
                                    </div>
                                )}
                            </div>
                            <div className="overflow-y-auto p-4 space-y-3 flex-grow">
                                {files.map((file) => (
                                    <div key={`${file.name}-${file.lastModified}`} className={`flex items-center p-3 rounded-lg border transition-all animate-fade-in-up ${theme === 'dark' ? 'bg-[#1C1C2E] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                        <FileText className="w-6 h-6 mr-4 text-violet-500 flex-shrink-0" />
                                        <div className="flex-grow overflow-hidden">
                                            <p className={`font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} title={file.name}>
                                                {file.name}
                                            </p>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                                {formatBytes(file.size)}
                                            </p>
                                        </div>
                                        <div className="flex items-center ml-4 space-x-1">
                                            <button onClick={() => window.open(URL.createObjectURL(file))} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`} title="Preview">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => removeFile(file.name)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-red-900/50' : 'hover:bg-red-100'}`} title="Remove">
                                                <X className="w-5 h-5 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center h-full p-8">
                            <Files className="w-16 h-16 mb-4 text-gray-500" />
                            <h3 className="font-semibold text-lg">Your files will appear here</h3>
                            <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                Drop files in the upload zone to get started.
                            </p>
                        </div>
                    )}
                    
                    <div className="mt-auto p-4 border-t border-inherit flex-shrink-0">
                        <button 
                            onClick={handleProceed} 
                            disabled={files.length === 0 || isOverLimit} 
                            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                        >
                            Upload and Proceed
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Upload;