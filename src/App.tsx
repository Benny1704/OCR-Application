import {createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route, RouterProvider } from "react-router-dom"
import './App.css'
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

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
    const auth = useContext(AuthContext);
    if (!auth?.user) {
        return <Navigate to="login" replace />;
    }
    return allowedRoles.includes(auth.user.role) ? <Outlet /> : <Navigate to="queue" replace />;
};

const routeDefinitions = createRoutesFromElements(
  <Route>

    <Route path="/login" element={<Login />} />

    <Route element={<RootLayout/>}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log" element={<Logs />} />
      </Route>

      {/* <Route path="dashboard" element={<Dashboard/>} /> */}
      {/* <Route path="log" element={<Logs/>} /> */}
      <Route path="/queue" element={<Queue/>} />
      <Route path="/document" element={<Documents/>} />
      <Route path="/upload" element={<Upload/>} />
      <Route path="/imageAlteration" element={<ImageAlterations />} />
      <Route path="/edit" element={<Edit />} />
      <Route path="/preview" element={<Preview />} />
+      <Route path="/manualEntry" element={<ManualEntry />} />
    </Route>

  </Route>
);

const router = createBrowserRouter(routeDefinitions)

function App() {

  return (

    <AuthProvider>
        <ThemeProvider>
            <RouterProvider router={router} />
        </ThemeProvider>
    </AuthProvider>
    // <RouterProvider router={router}></RouterProvider>
  )
}

export default App
