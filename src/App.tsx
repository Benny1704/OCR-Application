import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route, RouterProvider } from "react-router-dom";
import './App.css';
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
import { AuthContext, AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContexts";
import { ToastProvider } from "./contexts/ToastContext";
import { useToast } from "./hooks/useToast";
import { Toast, UploadStatus } from "./components/common/Helper";
import { AnimatePresence } from "framer-motion";
import Review from "./pages/Review";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
    const auth = useContext(AuthContext);
    if (!auth?.user) {
        return <Navigate to="/login" replace />;
    }
    return allowedRoles.includes(auth.user.role) ? <Outlet /> : <Navigate to="/queue" replace />;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/login" element={<Login />} />
      <Route element={<RootLayout/>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/log" element={<Logs />} />
        </Route>
        <Route path="/queue" element={<Queue/>} />
        <Route path="/document" element={<Documents/>} />
        <Route path="/upload" element={<Upload/>} />
        <Route path="/imageAlteration" element={<ImageAlterations />} />
        <Route path="/edit" element={<Edit />} />
        <Route path="/review/:id" element={<Review />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/manualEntry" element={<ManualEntry />} />
      </Route>
    </Route>
  )
);

const AppWithToasts = () => {
    const { toasts, removeToast, uploadFiles, hideUploadStatus } = useToast();

    return (
        <>
            <RouterProvider router={router} />
            <div className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-2">
                <AnimatePresence>
                    {uploadFiles && uploadFiles.length > 0 && (
                       <UploadStatus files={uploadFiles} onClose={hideUploadStatus} />
                    )}
                    {toasts.map(toast => (
                        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppWithToasts />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App;