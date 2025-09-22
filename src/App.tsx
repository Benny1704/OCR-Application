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
import { useContext } from "react";
import { AuthContext } from "./contexts/AuthContext";
import { useToast } from "./hooks/useToast";
import { Toast, UploadStatus } from "./components/common/Helper";
import { AnimatePresence } from "framer-motion";
import Review from "./pages/Review";

// The ProtectedRoute component is used to protect routes that require authentication.
// It checks if the user is authenticated and has the required role to access the route.
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

// The AppRoutesAndToasts component defines the application's routes and renders toast notifications.
const AppRoutesAndToasts = () => {
  const { toasts, removeToast, uploadFiles, hideUploadStatus } = useToast();

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

// The App component is the root component of the application.
// It wraps the AppRoutesAndToasts component in the necessary providers.
const App = () => {
  return (
    <AppRoutesAndToasts />
  );
};

export default App;