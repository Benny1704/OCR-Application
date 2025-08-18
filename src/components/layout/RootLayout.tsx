import { useLocation, Outlet } from "react-router-dom";
import '../../assets/styles/Layout.scss'
import Header from "./Header";
import Sidenav from "./Sidenav";
              
const RootLayout = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/d' || location.pathname === '/login';

  return (
    <>
      {isLogin ? (
        
        <Outlet />

      ) : (
        
        <div className="layout">
          <div className="sidenav"><Sidenav/></div>
          <div className="outlet"><Outlet/></div>
        </div>

        // <>
        //   <Header/>
        //   <Outlet />
        // </>

      )}
    </>
  );
};

export default RootLayout