import { lazy, useContext } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './App.css';
import RootLayout from './components/layout/RootLayout';
import { AuthContext } from './contexts/AuthContext';
import { useToast } from './hooks/useToast';
import { Toast, UploadStatus } from './components/common/Helper';
import { type Role } from './interfaces/Types';

// Lazy load page components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Queue = lazy(() => import('./pages/Queue'));
const Documents = lazy(() => import('./pages/Documents'));
const Upload = lazy(() => import('./pages/Upload'));
const Logs = lazy(() => import('./pages/Logs'));
const Login = lazy(() => import('./pages/Login'));
const ImageAlterations = lazy(() => import('./pages/ImageAlterations'));
const Edit = lazy(() => import('./pages/Edit'));
const Preview = lazy(() => import('./pages/Preview'));
const ManualEntry = lazy(() => import('./pages/ManualEntry'));
const Review = lazy(() => import('./pages/Review'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ProtectedRoute component to handle role-based access control
const ProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const auth = useContext(AuthContext);

  if (!auth || !auth.user) {
    // Navigate to login if auth context or user is not available
    return <Navigate to="/login" replace />;
  }

  // Check if the user's role is included in the allowed roles
  return allowedRoles.includes(auth.user.role) ? <Outlet /> : <Navigate to="/queue" replace />;
};

const AppRoutesAndToasts = () => {
  const { toasts, removeToast, uploadFiles, hideUploadStatus } = useToast();

  return (
    <>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
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

          {/* Fallback route for any path not matched */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      <div className="fixed top-5 right-5 z-[200] space-y-3">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>

      {uploadFiles && (
        <div className="fixed bottom-5 right-5 z-[200]">
          <UploadStatus files={uploadFiles} onClose={hideUploadStatus} />
        </div>
      )}
    </>
  );
};

const App = () => {
  return <AppRoutesAndToasts />;
};

export default App;