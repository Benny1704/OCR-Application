import { useLayoutEffect, useRef, useState, useEffect, type FormEvent } from 'react';
import BrandLogo from '../../assets/images/RMKV_logo.png';
import '../../assets/styles/Layout.scss';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { getSections } from '../../lib/api/Api';
import { useToast } from '../../hooks/useToast';
import type { Section } from '../../interfaces/Types';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { User, LogOut, Lock, X, Eye, EyeOff } from 'lucide-react';
import ModernDropdown from '../common/ModernDropdown';

const updateActivePosition = (ref: React.RefObject<HTMLUListElement | null>) => {
    if (ref.current) {
        const activeLink = ref.current.querySelector('.nav-item.active') as HTMLElement;
        if (activeLink) {
            const activeLi = activeLink.parentElement;
            if (activeLi) {
                ref.current.style.setProperty('--position-y-active', `${activeLi.offsetTop}px`);
                ref.current.style.setProperty('--position-x-active', `${activeLi.offsetLeft}px`);
            }
        }
    }
};

const Sidenav = () => {
    const sidenavRef = useRef<HTMLUListElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const { user, logout, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedSection, setSelectedSection] = useState<number | null>(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const { addToast } = useToast();

    // --- Animation Variants ---
    const popupVariants: Variants = {
        hidden: { opacity: 0, scale: 0.7 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 500, damping: 30 }
        },
        exit: { opacity: 0, scale: 0.7, transition: { duration: 0.15 } }
    };

    const contentVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { delay: 0.1, duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.1 } }
    };
    // --- End of Animation Variants ---

    useEffect(() => {
        const fetchSections = async () => {
            const sectionsData = await getSections(addToast);
            setSections(sectionsData);
        };
        fetchSections();

        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
                setShowPasswordModal(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    const handleSectionSelect = (section_id: number) => {
        if (section_id !== user?.section) {
            setSelectedSection(section_id);
            setShowPasswordModal(true);
        }
    };

    const handleSectionSwitch = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !selectedSection || !password) return;
        
        setIsSwitching(true);
        const loggedInUser = await login({
            username: user.username,
            password,
            section_id: selectedSection
        });
        setIsSwitching(false);

        if (loggedInUser) {
            addToast({ message: "Successfully switched section!", type: "success" });
            window.location.reload();
        } else {
            addToast({ message: "Password incorrect. Please try again.", type: "error" });
            setPassword('');
        }
    };
    
    const currentSectionName = sections.find(s => s.section_id === user?.section)?.section_name || '...';

    const navItem = [
        ...(user?.role === 'admin' ? [{ name: "Dashboard", link: "dashboard", icon: "fi-rr-objects-column" }] : []),
        { name: "Queue", link: "queue", icon: "fi-rr-calendar-clock" },
        { name: "Documents", link: "document", icon: "fi-rr-document" },
        { name: "Upload", link: "upload", icon: "fi-rr-folder-upload" },
        ...(user?.role === 'admin' ? [{ name: "Logs", link: "log", icon: "fi-rr-square-terminal" }] : []),
    ];

    useLayoutEffect(() => {
        updateActivePosition(sidenavRef);
        const observer = new ResizeObserver(() => updateActivePosition(sidenavRef));
        if (sidenavRef.current) observer.observe(sidenavRef.current);
        return () => {
            if (sidenavRef.current) observer.unobserve(sidenavRef.current);
        };
    }, [location.pathname]);
    
    return (
        <div className="sidenav-container">
            <div className="brand-icon">
                <img src={BrandLogo} alt="Brand Logo" />
            </div>

            <nav className="nav-container" ref={sidenavRef}>
                <ul className="nav">
                    {navItem.map((nav, i) =>
                        <li key={i}>
                            <NavLink
                                to={nav.link}
                                className={({ isActive }) => {
                                    if (nav.name === 'Queue') {
                                        const queuePaths = ['/queue', '/edit', '/preview', '/imageAlteration', '/manualEntry'];
                                        return queuePaths.some(path => location.pathname.startsWith(path)) ? 'nav-item active' : 'nav-item';
                                    }
                                    if (nav.name === 'Documents') {
                                        const docPaths = ['/document', '/review'];
                                        return docPaths.some(path => location.pathname.startsWith(path)) ? 'nav-item active' : 'nav-item';
                                    }
                                    return isActive ? 'nav-item active' : 'nav-item';
                                }}
                            >
                                <i className={`fi ${nav.icon}`}></i>
                                <p className="tooltip">{nav.name}</p>
                            </NavLink>
                        </li>
                    )}
                    <div className="theme-toggle"><ThemeToggle /></div>
                    <div className="nav-effect"></div>
                </ul>
            </nav>

            <div className="actions">
                <div className="profile-container" ref={popupRef}>
                    <motion.button
                        className="profile action"
                        onClick={() => setProfileOpen(!isProfileOpen)}
                        whileTap={{ scale: 0.8 }}
                    >
                        <User size={20} />
                    </motion.button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div
                                className="profile-popup"
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={popupVariants}
                                style={{ transformOrigin: 'bottom left' }}
                            >
                                <AnimatePresence mode="wait">
                                {!showPasswordModal ? (
                                    <motion.div key="profile-view" variants={contentVariants} initial="hidden" animate="visible" exit="hidden">
                                        <div className="user-info">
                                            <div className="avatar">{user?.username.charAt(0)}</div>
                                            <p className="username">{user?.username}</p>
                                            <p className="section-name">{currentSectionName}</p>
                                        </div>
                                        <div className="section-switcher">
                                            <p className="label">Switch Section</p>
                                            <ModernDropdown
                                                sections={sections}
                                                selectedSection={user?.section || 0}
                                                onSectionSelect={handleSectionSelect}
                                            />
                                        </div>
                                        <motion.button className="logout-btn" onClick={handleLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <LogOut size={16} />
                                            <span>Logout</span>
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <motion.div key="password-view" className="password-modal" variants={contentVariants} initial="hidden" animate="visible" exit="hidden">
                                        <div className="modal-header">
                                            <h4>Confirm Switch</h4>
                                            <button className="close-modal" onClick={() => setShowPasswordModal(false)}><X size={18} /></button>
                                        </div>
                                        <p>Enter password to switch to <strong>{sections.find(s => s.section_id === selectedSection)?.section_name}</strong></p>
                                        <form onSubmit={handleSectionSwitch}>
                                            <div className="input-wrapper">
                                                <Lock size={16} className="input-icon" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    autoFocus
                                                />
                                                <button type="button" className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <motion.button type="submit" className="confirm-btn" disabled={isSwitching} whileTap={{ scale: 0.95 }}>
                                                {isSwitching ? 'Verifying...' : 'Switch & Verify'}
                                            </motion.button>
                                        </form>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

export default Sidenav;