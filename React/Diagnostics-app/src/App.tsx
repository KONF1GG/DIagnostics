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

const App = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/login" && location.pathname !== "/register" && (
        <Navbar />
      )}

      <div style={{ paddingBottom: '60px' }}> {/* Отступ снизу для контента */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Reg />} />
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/network" element={<Network />} />
          <Route path="/accidents" element={<Accidents />} />
          <Route path="/cameras" element={<Cameras />} />
          <Route path="/TV" element={<TV />} />
        </Routes>
      </div>

    </>
  );
};

export default App;