import { useLocation, Outlet } from "react-router-dom";
import Header from "./Header";
import Sidenav from "./Sidenav";


const RootLayout = () => {

    const location = useLocation();

    // const isLogin = location.pathname === ('/' || "/login") ? 

    // <Outlet></Outlet> :

    // <>
    //   <Header/>
    //     <Outlet></Outlet>
    //   <Sidenav/>
    // </>;

    const isLogin = 
    <>
        <Header/>
            <Outlet></Outlet>
        {/* <Sidenav/> */}
    </>;

  return (
    <div id="app">
      {isLogin}
      {/* hello */}
    </div>
  )
}

export default RootLayout