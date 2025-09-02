import { useLocation, Outlet } from "react-router-dom";
import '../../assets/styles/Layout.scss';
import Sidenav from "./Sidenav";
import { useAuth } from "../../hooks/useAuth";

const RootLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isLogin = location.pathname === '/login' || !user;


  return (
    <>
      {isLogin ? (

        <Outlet />

      ) : (

        <div className="layout">
          <div className="sidenav"><Sidenav/></div>
          <div className="outlet"><Outlet/></div>
        </div>

      )}
    </>
  );
};

export default RootLayout