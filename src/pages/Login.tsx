import { User, Lock, AlertTriangle, Eye, EyeOff, Building, ChevronDown } from 'lucide-react';
import { useState, type FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import brandLogo from '../assets/images/RMKV_logo.png';
import { motion, AnimatePresence } from "framer-motion";
import { getSections } from '../lib/api/Api';
import type { Section } from '../interfaces/Types';
import { containerVariants, itemVariants } from '../components/common/Animation';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('Admin');
    const [password, setPassword] = useState('password@123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<number | ''>('');

    // --- Dropdown Specific State and Logic ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedSectionName = sections?.find(s => s.section_id === selectedSection)?.section_name;

    useEffect(() => {
        const fetchSections = async () => {
            const sectionsData = await getSections();
            setSections(sectionsData);
            if (sectionsData.length > 0) {
                setSelectedSection(sectionsData[0].section_id);
            }
        };
        fetchSections();
    }, []);
    
    const listVariants = {
        hidden: { opacity: 0, scaleY: 0 },
        visible: { opacity: 1, scaleY: 1, transition: { duration: 0.2 } },
    };

    const dropdownItemVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };
    // --- End of Dropdown Logic ---

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (selectedSection === '') {
            setError('Please select a section.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const user = await login({ username, password, section_id: selectedSection as number });

            if (user) {
                navigate(user.role === 'admin' ? '/dashboard' : '/queue');
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } catch (error) {
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={{ background: 'radial-gradient(circle, #2d3a4b 0%, #1a1a2e 100%)' }}>
            <motion.div
                className="bg-white/5 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="flex flex-col items-center mb-6 text-center">
                    <img src={brandLogo} className="w-25 mb-4" alt="RMKV Logo" />
                    <h1 className="text-xl font-bold text-white">Welcome to RMKV Silks!</h1>
                    {/* <p className="text-gray-400 text-sm">Log in to continue to RMKV</p> */}
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username and Password fields remain the same */}
                    <motion.div variants={itemVariants} className="relative">
                        <User className="w-5 h-5 text-gray-400 absolute top-1/2 left-4 -translate-y-1/2" />
                        <input
                            className="w-full py-3 pl-12 pr-4 text-white bg-white/10 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:text-gray-400"
                            id="username"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </motion.div>
                    <motion.div variants={itemVariants} className="relative">
                        <Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-4 -translate-y-1/2" />
                        <input
                            className="w-full py-3 pl-12 pr-12 text-white bg-white/10 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:text-gray-400"
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </motion.div>

                    {/* --- Custom Dropdown Implementation --- */}
                    <motion.div 
                        variants={itemVariants} 
                        className="relative" 
                        ref={dropdownRef}
                    >
                        <Building className="w-5 h-5 text-gray-400 absolute top-1/2 left-4 -translate-y-1/2 z-10" />
                        <motion.button
                            type="button"
                            className="login-dropdown-button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>{selectedSectionName || "Select a Section"}</span>
                            <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }}>
                                <ChevronDown size={18} />
                            </motion.div>
                        </motion.button>
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.ul
                                    className="login-dropdown-list drop-up"
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    variants={listVariants}
                                    style={{ originY: 1 }} // Set originY to 1 for bottom-to-top animation
                                >
                                    {Array.isArray(sections) && sections.map(section => (
                                        <motion.li
                                            key={section.section_id}
                                            onClick={() => {
                                                setSelectedSection(section.section_id);
                                                setIsDropdownOpen(false);
                                            }}
                                            variants={dropdownItemVariants}
                                            whileHover={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                                        >
                                            {section.section_name}
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            )}
                        </AnimatePresence>
                    </motion.div>
                    {/* --- End of Custom Dropdown --- */}

                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex items-center justify-center gap-2 text-red-400 text-sm text-center"
                            >
                                <AlertTriangle size={16} /> {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <motion.div variants={itemVariants}>
                        <motion.button
                            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-4 focus:ring-violet-500/50 transition-shadow duration-300 shadow-lg hover:shadow-purple-500/40 disabled:opacity-50"
                            type="submit"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </motion.button>
                    </motion.div>
                </form>

            </motion.div>
        </div>
    );
}

export default Login;