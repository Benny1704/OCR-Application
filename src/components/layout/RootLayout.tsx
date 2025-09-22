import { Suspense } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import '../../assets/styles/Layout.scss';
import Sidenav from './Sidenav';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../common/Loader';

// The RootLayout component defines the basic layout of the application.
// It displays the Sidenav component if the user is authenticated and not on the login page.
const RootLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isLogin = location.pathname === '/login' || !user;

  return (
    <>
      {isLogin ? (
        // Suspense is added here to handle lazy loading for public routes like login.
        <Suspense fallback={<Loader type="wifi" />}>
          <Outlet />
        </Suspense>
      ) : (
        <div className="layout">
          <div className="sidenav">
            <Sidenav />
          </div>
          <main className="outlet">
            {/*
              Suspense is added here to show a loader within the main content area
              while keeping the Sidenav visible during page navigation.
            */}
            <Suspense fallback={<Loader type="wifi" />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      )}
    </>
  );
};

export default RootLayout;