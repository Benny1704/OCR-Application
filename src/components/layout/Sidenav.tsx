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
                ref.current.style.setProperty('--position-y-active', `${activeLi.offsetTop}px`);
                ref.current.style.setProperty('--position-x-active', `${activeLi.offsetLeft}px`);
            }
        }
    }
};

const Sidenav = () => {
    const sidenavRef = useRef<HTMLUListElement>(null);
    const navItem = [
        { name: "Dashboard", link: "dashboard" , icon: "fi-sr-objects-column" },
        // { name: "Queue", link: "queue" , icon: "fi-rr-hourglass-end" },
        { name: "Queue", link: "queue" , icon: "fi-sr-calendar-clock" },
        // { name: "Documents", link: "document" , icon: "fi-sr-document" },
        { name: "Upload", link: "upload" , icon: "fi-sr-cloud-upload-alt" },
        { name: "Logs", link: "log" , icon: "fi-sr-square-terminal" },
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

        <div className="sidenav-container">
            <div className="brand-icon flex justify-start items-center">
                <img src={BrandLogo} alt=""/>
            </div>

            <nav className="nav-container" ref={sidenavRef}>
                <ul className="nav">
                    {navItem.map((nav,i) => 
                        <li key={i}>
                            <NavLink to={nav.link} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                                <i className={`fi ${nav.icon}`}></i>
                                <p className="tooltip">{nav.name}</p>
                            </NavLink>
                        </li>
                    )}
                    <div className="nav-effect"></div>
                </ul>
            </nav>
            
            <div className="actions">
                {/* <button className="upload action font-medium"> <i className="fi fi-sr-upload"></i></button> */}
                <button className="logout action font-medium"> <i className="fi fi-sr-sign-out-alt"></i></button>
            </div>
        </div>

    )
}

export default Sidenav