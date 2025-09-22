import { useLocation, Outlet } from "react-router-dom";
import '../../assets/styles/Layout.scss';
import Sidenav from "./Sidenav";
import { useAuth } from "../../hooks/useAuth";

// The RootLayout component defines the basic layout of the application.
// It displays the Sidenav component if the user is authenticated and not on the login page.
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
          <main className="outlet"><Outlet/></main>
        </div>
      )}
    </>
  );
};

export default RootLayout;