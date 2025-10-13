import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import "./App.css";
import RootLayout from "./components/layout/RootLayout";
import Dashboard from "./pages/Dashboard";
import Queue from "./pages/Queue";
import Documents from "./pages/Documents";
import Upload from "./pages/Upload";
import Logs from "./pages/Logs";
import Login from "./pages/Login";
import ImageAlterations from "./pages/ImageAlterations";
import Edit from "./pages/Edit";
import Preview from "./pages/Preview";
import ManualEntry from "./pages/ManualEntry";
import { type Role } from "./interfaces/Types";
import { useContext, useEffect, useRef } from "react";
import { AuthContext, AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContexts";
import { ToastProvider } from "./contexts/ToastContext";
import { useToast } from "./hooks/useToast";
import { Toast, UploadStatus } from "./components/common/Helper";
import { AnimatePresence } from "framer-motion";
import Review from "./pages/Review";
import { setGlobalToast } from "./lib/api/Api";
import { SectionProvider } from "./contexts/SectionContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import GlobalNavigationButtons from "./components/common/GlobalNavigationButton";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const auth = useContext(AuthContext);
  
  if (!auth) return null; 
  
  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }
  
  return allowedRoles.includes(auth.user.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/queue" replace />
  );
};

const AppRoutesAndToasts = () => {
  const { toasts, removeToast, uploadFiles, hideUploadStatus, addToast } = useToast();
  const errorToastDebounce = useRef(false);

  useEffect(() => {
    const debouncedAddToast = (toast: { message: string, type: "error" | "success" }) => {
      if (toast.type === 'success') {
        addToast(toast);
        return;
      }
      
      if (toast.type === 'error' && !errorToastDebounce.current) {
        errorToastDebounce.current = true;
        addToast(toast);
        
        setTimeout(() => {
          errorToastDebounce.current = false;
        }, 5000);
      }
    };

    setGlobalToast(debouncedAddToast);
  }, [addToast]);

  return (
    <>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/log" element={<Logs />} />
          </Route>
          <Route path="/queue" element={<Queue />} />
          <Route path="/document" element={<Documents />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/imageAlteration" element={<ImageAlterations />} />
          <Route path="/edit/:invoiceId" element={<Edit />} />
          <Route path="/review/:invoiceId" element={<Review />} />
          <Route path="/preview/:invoiceId" element={<Preview />} />
          <Route path="/manualEntry/:invoiceId" element={<ManualEntry />} />
        </Route>
      </Routes>
      
      {/* Global Navigation Buttons */}
      <GlobalNavigationButtons />
      
      <div className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-2">
        <AnimatePresence>
          {uploadFiles && uploadFiles.length > 0 && (
            <UploadStatus files={uploadFiles} onClose={hideUploadStatus} />
          )}
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SectionProvider>
            <NavigationProvider>
              <AppRoutesAndToasts />
            </NavigationProvider>
          </SectionProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;