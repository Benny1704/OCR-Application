import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom"
import './App.css'
import RootLayout from "./components/layout/RootLayout";
import Dashboard from "./pages/Dashboard";
import Queue from "./pages/Queue";
import Documents from "./pages/Documents";
import Upload from "./pages/Upload";
import Logs from "./pages/Logs";

const routeDefinitions = createRoutesFromElements(
  <Route path="/" element={<RootLayout/>} >
    <Route index  path="/dashboard" element={<Dashboard/>} />
    <Route path="/queue" element={<Queue/>} />
    <Route path="/document" element={<Documents/>} />
    <Route path="/upload" element={<Upload/>} />
    <Route path="/log" element={<Logs/>} />
  </Route>
);

const router = createBrowserRouter(routeDefinitions)

function App() {

  return (
    <RouterProvider router={router}></RouterProvider>
  )
}

export default App
