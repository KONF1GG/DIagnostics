import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../CSS/SideMenu.css";

interface SideMenuProps {
  login: string;
}

const SideMenu: React.FC<SideMenuProps> = ({ login }) => {
  const location = useLocation();

  return (
    <div className="side-menu-wrapper">
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
              to={`/${path}?login=${encodeURIComponent(login)}`}
              className={`nav-link ${
                location.pathname.includes(path) ? "active" : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SideMenu;
