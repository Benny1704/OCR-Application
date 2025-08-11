import { useLocation, Outlet, NavLink } from "react-router-dom";
import { useLayoutEffect, useRef } from 'react'
import BrandLogo from '../../assets/images/logo.png'
import '../../assets/styles/Layout.scss'

const updateActivePosition = (ref: React.RefObject<HTMLUListElement | null>) => {
    if (ref.current) {
        const activeLink = ref.current.querySelector('.nav-item.active') as HTMLElement;
        if (activeLink) {
            const activeLi = activeLink.parentElement;
            if (activeLi) {
                ref.current.style.setProperty('--position-y-active', `${activeLi.offsetTop}px`);
            }
        }
    }
};
              
const RootLayout = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/d' || location.pathname === '/login';

  const sidenavRef = useRef<HTMLUListElement>(null);
  const navItem = [
      { name: "Dashboard", link: "dashboard" , icon: "fi-rr-objects-column" },
      // { name: "Queue", link: "queue" , icon: "fi-rr-hourglass-end" },
      { name: "Queue", link: "queue" , icon: "fi-rr-calendar-clock" },
      { name: "Documents", link: "document" , icon: "fi-rr-document" },
      { name: "Reports", link: "report" , icon: "fi-rr-stats" },
      { name: "Logs", link: "log" , icon: "fi-rr-square-terminal" },
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
    <>
      {isLogin ? (
        
        <Outlet />

      ) : (
        
        <div className="layout">
          <div className="sidenav-container">
            <div className="brand-icon">
                <img src={BrandLogo} alt=""/>
                {/* <span></span>
                <h1>NEXTRIQ</h1> */}
            </div>

            <nav className="nav-container" ref={sidenavRef}>
                <ul className="nav">
                    {navItem.map((nav,i) => 
                      <li key={i}>
                          <NavLink to={nav.link} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                              <i className={`fi ${nav.icon}`}></i>
                              {/* <p className="text">{nav.name}</p> */}
                          </NavLink>
                      </li>
                    )}
                    <div className="nav-effect">
                      <div className="shape"></div>
                    </div>
                </ul>
            </nav>
            
            <div className="action-container">
                <div className="action">
                  <button className="upload action font-medium"> <i className="fi fi-rr-cloud-upload"></i></button>
                  <button className="logout action font-medium"> <i className="fi fi-rr-sign-out-alt"></i></button>
                </div>
            </div>
          </div>
          <div className="outlet-container">
            <div className="outlet"><Outlet /></div>
          </div>
        </div>

      )}
    </>
  );
};

export default RootLayout