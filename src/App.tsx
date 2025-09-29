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

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const auth = useContext(AuthContext);
  
  // Handle the case where context is not yet available
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

// This component is correctly placed inside all the providers.
const AppRoutesAndToasts = () => {
  // We can safely call useToast() here.
  const { toasts, removeToast, uploadFiles, hideUploadStatus, addToast } = useToast();
  // Create a ref to track if an error toast is already visible.
  const errorToastDebounce = useRef(false);

  // We'll set the global toast function from here.
  useEffect(() => {
    // This is our new, smarter toast function that prevents spam.
    const debouncedAddToast = (toast: { message: string, type: "error" | "success" }) => {
      // For success messages, we always want to show them.
      if (toast.type === 'success') {
        addToast(toast);
        return;
      }
      
      // For error messages, we check if our "alarm" is already ringing.
      if (toast.type === 'error' && !errorToastDebounce.current) {
        // If not, we ring the alarm and set the flag.
        errorToastDebounce.current = true;
        addToast(toast);
        
        // We reset the flag after a delay. This should be a bit longer
        // than your toast's auto-dismiss time to prevent another toast
        // from popping up immediately as the first one disappears.
        setTimeout(() => {
          errorToastDebounce.current = false;
        }, 5000); // 5 seconds, adjust if your toast duration is different.
      }
    };

    // We provide our smart function to the entire API layer.
    setGlobalToast(debouncedAddToast);
  }, []); // The effect re-runs if addToast ever changes.

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

// The App component now only sets up the providers.
function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRoutesAndToasts />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

