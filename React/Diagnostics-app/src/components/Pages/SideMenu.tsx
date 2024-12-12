import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logout } from './Navbar';
import "../CSS/SideMenu.css";

interface SidebarProps {
  login: string;
}

const Sidebar: React.FC<SidebarProps> = ({ login }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  // const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="d-flex">
      {/* Выдвигающееся меню */}
      <div className={`side-menu-wrapper ${isSidebarOpen ? 'open' : 'open'}`}>
        <div className="side-menu">
          <nav>
            {[
              { path: 'network', label: 'Сеть' },
              { path: 'accidents', label: 'Аварии' },
              { path: 'cameras', label: 'Камеры' },
              { path: 'TV', label: 'ТВ' },
              { path: 'app', label: 'Приложение' },
            ].map(({ path, label }, index) => (
              <Link
                key={index}
                to={`/${path}?login=${encodeURIComponent(login)}`}
                className={`nav-link ${
                  location.pathname.includes(path) ? 'active' : ''
                }`}
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

      {/* Кнопка для показа меню
      <button
        className="toggle-menu-btn"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? 'Скрыть меню' : 'Показать меню'}
      </button> */}

      {/* Основной контент */}
      <div className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        {/* Ваш основной контент здесь */}
      </div>
    </div>
  );
};

export default Sidebar;
