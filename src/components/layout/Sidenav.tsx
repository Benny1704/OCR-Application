import { useLayoutEffect, useRef } from 'react';
import BrandLogo from '../../assets/images/RMKV_logo.png';
import '../../assets/styles/Layout.scss';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';

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
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    }
    
    const navItem = [
        ...(user?.role === 'admin' ? [{ name: "Dashboard", link: "dashboard" , icon: "fi-rr-objects-column" }] : []),
        { name: "Queue", link: "queue" , icon: "fi-rr-calendar-clock" },
        { name: "Documents", link: "document" , icon: "fi-rr-document" },
        { name: "Upload", link: "upload" , icon: "fi-rr-folder-upload" },
        ...(user?.role === 'admin' ? [{ name: "Logs", link: "log" , icon: "fi-rr-square-terminal" }] : []),
    ];

    useLayoutEffect(() => {
        updateActivePosition(sidenavRef);

        const observer = new ResizeObserver(() => {
            updateActivePosition(sidenavRef);
        });

        if (sidenavRef.current) {
            observer.observe(sidenavRef.current);
        }

        return () => {
            if (sidenavRef.current) {
                observer.unobserve(sidenavRef.current);
            }
        };
    }, [location.pathname]);

    return (

        <div className="sidenav-container">
            <div className="brand-icon flex justify-start items-center">
                <img src={BrandLogo} alt="Brand Logo"/>
            </div>

            <nav className="nav-container" ref={sidenavRef}>
                <ul className="nav">
                    {navItem.map((nav,i) => 
                        <li key={i}>
                            <NavLink 
                                to={nav.link} 
                                className={({ isActive }) => {
                                    if (nav.name === 'Queue') {
                                        const queuePaths = ['/queue', '/edit', '/preview', '/imageAlteration', '/manualEntry'];
                                        const isQueueActive = queuePaths.some(path => location.pathname.startsWith(path));
                                        return isQueueActive ? 'nav-item active' : 'nav-item';
                                    }
                                    if (nav.name === 'Documents') {
                                        const docPaths = ['/document', '/review'];
                                        const isDocActive = docPaths.some(path => location.pathname.startsWith(path));
                                        return isDocActive ? 'nav-item active' : 'nav-item';
                                    }
                                    return isActive ? 'nav-item active' : 'nav-item';
                                }}
                            >
                                <i className={`fi ${nav.icon}`}></i>
                                <p className="tooltip">{nav.name}</p>
                            </NavLink>
                        </li>
                    )}
                    
                    <div className="theme-toggle"><ThemeToggle></ThemeToggle></div>
                    <div className="nav-effect"></div>
                </ul>
            </nav>
            
            <div className="actions">
                <button className="logout action font-medium" onClick={handleLogout}> <i className="fi fi-sr-sign-out-alt"></i></button>
            </div>
        </div>

    )
}

export default Sidenav;