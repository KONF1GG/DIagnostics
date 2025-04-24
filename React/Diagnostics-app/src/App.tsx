import { Route, Routes, useLocation } from "react-router-dom";
import Login from "./components/Pages/Login";
import Reg from "./components/Pages/Reg";
import Home from "./components/Pages/Home";
import Users from "./components/Pages/Users";
import Navbar from "./components/Pages/Navbar";
import Network from "./components/Pages/Network";
import Accidents from "./components/Pages/Accidents";
import Cameras from "./components/Pages/Cameras";
import TV from "./components/Pages/TV/TV";
import App_page from "./components/Pages/App_/app";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SubsectionPage from "./components/Pages/Default/GeneralPage/GeneralSubsection";
import UserPage from "./components/Pages/UserPage";
import PaymentPage from "./components/Pages/Payment/payment";

const App = () => {
  const location = useLocation();

  return (
    <>
      <ToastContainer />
      {location.pathname !== "/login" && location.pathname !== "/register" && (
        <Navbar />
      )}

      <div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Reg />} />
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserPage />} />
          <Route path="/network" element={<Network />} />
          <Route path="/accidents" element={<Accidents />} />
          <Route path="/cameras" element={<Cameras />} />
          <Route path="/TV" element={<TV />} />
          <Route path="/app" element={<App_page />}></Route>
          <Route path="/subsection" element={<SubsectionPage />} />
          <Route path="/payments" element={<PaymentPage />}></Route>
        </Routes>
      </div>
    </>
  );
};

export default App;
