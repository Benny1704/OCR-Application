import { HardDriveUpload, FileText, X, Eye, Paperclip, ChevronDown, Check } from 'lucide-react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import * as api from '../lib/api/Api';
import { uploadFormConfig, type FormField } from '../lib/config/Config';
import { listVariants, optionVariants, containerVariants, itemVariants } from '../components/common/Animation';
import { useAuth } from '../hooks/useAuth'; // Import useAuth

// --- Custom Animated Select Component ---
const CustomSelect = ({ field, value, onChange, theme }: { field: FormField, value: any, onChange: (key: string, value: any) => void, theme: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const selectedOption = field.options?.find(opt => opt.value === value);

    return (
        <div className="relative" ref={ref}>
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-full p-2.5 text-left border rounded-md transition-colors flex justify-between items-center ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
            >
                {selectedOption ? selectedOption.label : <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Select {field.label}</span>}
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={listVariants}
                        // Added max-height and overflow-y for scrolling
                        style={{ maxHeight: '250px', overflowY: 'auto' }}
                        className={`absolute z-10 w-full mt-2 border rounded-md shadow-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
                    >
                        {field.options?.map(option => (
                            <motion.li
                                key={option.value}
                                variants={optionVariants}
                                onClick={() => {
                                    onChange(field.key, option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex justify-between items-center p-2.5 cursor-pointer ${theme === 'dark' ? 'hover:bg-violet-500/20' : 'hover:bg-violet-500/10'}`}
                            >
                                {option.label}
                                {value === option.value && <Check className="w-5 h-5 text-violet-500" />}
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};


// --- Main Upload Component ---
const Upload = () => {
    const { theme } = useTheme();
    const { user } = useAuth(); // Get user from auth context
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState<{ [key: string]: any }>({ section_id: user?.section || '' });
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const { addToast } = useToast();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'] },
        maxSize: 15 * 1024 * 1024,
        multiple: false,
    });

    const removeFile = () => setFile(null);
    const handleInputChange = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

    const isFormValid = useMemo(() => {
        // return uploadFormConfig.every(field => {
        //     const value = formData[field.key];
        //     return value !== undefined && value !== null && value !== '';
        // }) && file;
        return true;
    }, [formData, file]);

    const handleProceed = async () => {
        if (!isFormValid) {
            addToast({ type: "error", message: "Please fill all fields and upload a file." });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const formattedData = Object.keys(formData).reduce((acc, key) => {
            const field = uploadFormConfig.find(f => f.key === key);
            if (field && field.type === 'number') {
                acc[key] = parseFloat(formData[key]);
            } else {
                acc[key] = formData[key];
            }
            return acc;
        }, {} as { [key: string]: any });

        try {
            const response = await api.uploadFiles(file!, formattedData, (p) => setUploadProgress(p));
            if (response.success) {
                addToast({ type: 'success', message: 'Upload complete!' });
                setFile(null);
                setFormData({ section_id: user?.section || '' });
            }
        } catch (error) {
            console.error("Upload failed in component:", error);
        } finally {
            setIsUploading(false);
        }
    };
    
    const formatBytes = (bytes: number, decimals: number = 2): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <motion.div
            className={`h-full w-full flex flex-col p-4 sm:p-6 transition-colors rounded-[30px] overflow-hidden ${theme === "dark" ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-900"}`}
            initial="hidden" animate="visible" variants={containerVariants}
        >
            <motion.header className="flex-shrink-0 mb-8" variants={itemVariants}>
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-3 rounded-xl shadow-lg"><Paperclip className="w-6 h-6 text-white" /></div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Invoice Upload</h1>
                        <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Fill the details, upload the invoice, and let us handle the rest.</p>
                    </div>
                </div>
            </motion.header>

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-8 min-h-0">
                <motion.div className="lg:col-span-2 flex flex-col gap-6" variants={itemVariants}>
                    <div {...getRootProps()} className={`relative flex-grow flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-300 group ${theme === 'dark' ? 'border-gray-700 hover:border-violet-500' : 'border-gray-300 hover:border-violet-500'} ${isDragActive ? (theme === 'dark' ? 'border-violet-500 bg-violet-900/20' : 'border-violet-500 bg-violet-50') : ''}`}>
                        <input {...getInputProps()} />
                        <motion.div initial={{ scale: 1 }} whileHover={{ scale: 1.05 }} className="flex flex-col items-center text-center text-gray-500 group-hover:text-violet-500 transition-colors">
                            <HardDriveUpload className="w-16 h-16 mb-4" />
                            <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{isDragActive ? "Drop your invoice here" : "Click or Drag & Drop"}</p>
                            <p className="text-sm mt-1">PDF, JPG, or JPEG (Max 15MB)</p>
                        </motion.div>
                    </div>
                    <AnimatePresence>
                        {file && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className={`flex items-center p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <FileText className="w-8 h-8 mr-4 text-violet-500 flex-shrink-0" />
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-medium truncate" title={file.name}>{file.name}</p>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{formatBytes(file.size)}</p>

                                </div>
                                <div className="flex items-center ml-4 space-x-1">
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => window.open(URL.createObjectURL(file))} className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Preview"><Eye className="w-5 h-5" /></motion.button>
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={removeFile} className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-red-900/50' : 'hover:bg-red-100'}`} title="Remove"><X className="w-5 h-5 text-red-500" /></motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div className={`lg:col-span-3 flex flex-col rounded-2xl border min-h-0 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`} variants={containerVariants}>
                    {isUploading ? (
                        <div className="flex flex-col items-center justify-center h-full p-8">
                            <h3 className="font-semibold text-2xl mb-4 text-violet-400">Processing Invoice</h3>
                            <p className="text-gray-500 mb-6">This will just take a moment...</p>
                            <div className={`w-full rounded-full h-2.5 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-900/50'}`}>
                                <motion.div className="bg-gradient-to-r from-violet-500 to-purple-500 h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.5, ease: "linear" }} />
                            </div>
                            <p className="mt-4 text-xl font-mono text-violet-300">{uploadProgress}%</p>
                        </div>
                    ) : (
                        <>
                            <motion.div className="p-5 border-b border-inherit flex-shrink-0" variants={itemVariants}><h3 className="font-semibold text-xl">Invoice Details</h3></motion.div>
                            <div className="overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 flex-grow">
                                {uploadFormConfig.map(field => (
                                    <motion.div key={field.key} variants={itemVariants} className={field.type === 'datetime-local' ? 'md:col-span-2' : ''}>
                                        <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{field.label}</label>
                                        {field.type === 'select'
                                            ? <CustomSelect field={field} value={formData[field.key]} onChange={handleInputChange} theme={theme} />
                                            : <input
                                                type={field.type || 'text'}
                                                value={formData[field.key] || ''}
                                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                placeholder={field.label}
                                                className={`w-full p-2.5 border rounded-md transition-colors ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-500' : 'bg-white border-gray-300 text-black placeholder:text-gray-400'}`}
                                              />
                                        }
                                    </motion.div>
                                ))}
                            </div>
                            <motion.div className="mt-auto p-4 border-t border-inherit flex-shrink-0" variants={itemVariants}>
                                <motion.button onClick={handleProceed} disabled={isUploading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Verify and Proceed
                                </motion.button>
                            </motion.div>
                        </>
                    )}
                </motion.div>
            </main>
        </motion.div>
    );
};

export default Upload;