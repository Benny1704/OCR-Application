import { useLocation, Outlet } from "react-router-dom";
import '../../assets/styles/Layout.scss';
import Sidenav from "./Sidenav";
import { useAuth } from "../../hooks/useAuth";
import { AnimatePresence, motion } from 'framer-motion';

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
          <div className="outlet">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ willChange: 'transform, opacity, filter' }}
              >
                <Outlet/>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      )}
    </>
  );
};

export default RootLayout