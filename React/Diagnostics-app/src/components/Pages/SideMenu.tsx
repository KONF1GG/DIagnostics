import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logout } from "./Navbar";
import "../CSS/SideMenu.css";
import { useSidebar } from "../../DataContext/SidebarContext";
import jsonData from "./../../components/FileData/diagnosticHelper.json";

interface SidebarProps {
  login: string;
}

const Sidebar: React.FC<SidebarProps> = ({ login }) => {
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    setSections(jsonData); 
  }, []);

  console.log(sections)
  const location = useLocation();
  const { isSidebarOpen } = useSidebar();

  return (
    <div className="d-flex">
      {/* Выдвигающееся меню */}
      <div className={`side-menu-wrapper ${isSidebarOpen ? "open" : ""}`}>
        <div className="side-menu">
          <nav>
            {[
              { path: "network", label: "Сеть" },
              { path: "accidents", label: "Аварии" },
              { path: "cameras", label: "Камеры" },
              { path: "TV", label: "ТВ" },
              { path: "app", label: "Приложение" },
            ].map(({ path, label }, index) => (
              <Link
                key={index}
                to={login ? `/${path}?login=${encodeURIComponent(login)}` : "#"}
                className={`nav-link ${
                  location.pathname.includes(path) ? "active" : ""
                }`}
                onClick={login ? undefined : (e) => e.preventDefault()}
                style={{
                  pointerEvents: login ? "auto" : "none",
                  color: login ? "inherit" : "gray",
                }} // Добавлено для отключения клика
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto">
            <Logout />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
