import { useEffect, useRef, useState } from 'react'
import BrandLogo from '../../assets/images/logo.png'
import '../../assets/styles/Layout.scss'
import { NavLink } from 'react-router-dom';

const Header = () => {
    
    const [activeIndex, setActiveIndex] = useState(0);
    const navItemElements = useRef<HTMLLIElement[]>([]);
    const sidenavRef = useRef<HTMLUListElement>(null);
    const navItem = [
        {
            name: "Dashboard",
            link: "dashboard"
        },
        {
            name: "Queue",
            link: "queue"
        },
        {
            name: "Documents",
            link: "document"
        },
        {
            name: "Reports",
            link: "report"
        },
        {
            name: "Logs",
            link: "log"
        },
    ];

    const updateActivePosition = () => {
        const activeElement = navItemElements.current[activeIndex];
        if (sidenavRef.current && activeElement) {
            sidenavRef.current.style.setProperty('--position-x-active', `${activeElement.offsetLeft}px`);
        }
    };

    useEffect(() => {
        updateActivePosition();
    }, [activeIndex]);

    const handleSetActiveIndex = (index: number) => {
        setActiveIndex(index);
    };

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
                        <NavLink to={nav.link} key={i} ref={el => {if(el){navItemElements.current[i] = el}}} onClick={() => handleSetActiveIndex(i)} className={`nav-item ${activeIndex == i ? 'active': ''}`}>
                            <span className='dot'></span>
                            <p className="text">{nav.name}</p>
                        </NavLink>
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