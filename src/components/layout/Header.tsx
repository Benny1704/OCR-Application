import { useLayoutEffect, useRef } from 'react'
import BrandLogo from '../../assets/images/logo.png'
import '../../assets/styles/Layout.scss'
import { NavLink } from 'react-router-dom';

const updateActivePosition = (ref: React.RefObject<HTMLUListElement | null>) => {
    if (ref.current) {
        const activeLink = ref.current.querySelector('.nav-item.active') as HTMLElement;
        if (activeLink) {
            const activeLi = activeLink.parentElement;
            if (activeLi) {
                ref.current.style.setProperty('--position-x-active', `${activeLi.offsetLeft}px`);
            }
        }
    }
};

const Header = () => {
    
    const sidenavRef = useRef<HTMLUListElement>(null);
    const navItem = [
        { name: "Dashboard", link: "dashboard" },
        { name: "Queue", link: "queue" },
        { name: "Documents", link: "document" },
        { name: "Reports", link: "report" },
        { name: "Logs", link: "log" },
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
    }, [window.location.pathname]);

    return (

        <div className="header-container">
            <div className="brand-icon flex justify-start items-center">
                <img src={BrandLogo} alt=""/>
                <span></span>
                <h1>NEXTRIQ</h1>
            </div>

            <nav className="nav-container" ref={sidenavRef}>
                <ul className="nav">
                    <div className="nav-icon">
                        {/* <img src={BrandLogo} alt="" /> */}
                        <i className="fi fi-sc-sparkles"></i>
                    </div>
                    {navItem.map((nav,i) => 
                        <li key={i}>
                            <NavLink to={nav.link} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                                <span className='dot'></span>
                                <p className="text">{nav.name}</p>
                            </NavLink>
                        </li>
                    )}
                    <div className="nav-effect"></div>
                </ul>
            </nav>
            
            <div className="actions">
                <button className="upload action font-medium"> <i className="fi fi-rr-cloud-upload"></i> Upload</button>
                <button className="logout action font-medium"> <i className="fi fi-rr-sign-out-alt"></i></button>
            </div>
        </div>

    )
}

export default Header