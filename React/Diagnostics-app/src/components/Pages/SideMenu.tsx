import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logout } from "./Navbar";
import "../CSS/SideMenu.css";
import { useSidebar } from "../../DataContext/SidebarContext";
import { useSidebarContext } from "../../DataContext/SideMenuContext";
import jsonData from "./../../components/FileData/diagnosticHelper.json";

interface SidebarProps {
  login: string;
}

const Sidebar: React.FC<SidebarProps> = ({ login }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const { openSections, toggleSection } = useSidebarContext(); // Используем контекст
  const sectionList = [
    { path: "network", label: "Сеть" },
    { path: "accidents", label: "Аварии" },
    { path: "cameras", label: "Камеры" },
    { path: "TV", label: "ТВ" },
    { path: "app", label: "Приложение" },
  ];

  useEffect(() => {
    // Инициализируем состояние открытых секций при загрузке
    if (Object.keys(openSections).length === 0) {
      jsonData.forEach((_, index) => toggleSection(index));
    }
  }, [jsonData, toggleSection]);

  // Парсим query-параметры
  const query = new URLSearchParams(location.search);
  const selectedSubsectionName = query.get("subsection");
  const queriedLogin = query.get("login");

  const openSubsection = (subsectionName: string) => {
    let url = `/subsection?subsection=${encodeURIComponent(subsectionName)}`;
    if (queriedLogin) {
      url += `&login=${encodeURIComponent(queriedLogin)}`;
    }
    navigate(url);
  };

  return (
    <div className="d-flex">
      <div className={`side-menu-wrapper ${isSidebarOpen ? "open" : ""}`}>
        <div className="side-menu">
          {jsonData.map((section, index) => (
            <div key={index} className="section">
              <h3
                className="section-title"
                onClick={() => toggleSection(index)}
              >
                {section.section}
                <span
                  className={`toggle-icon ${openSections[index] ? "open" : ""}`}
                >
                  {openSections[index] ? "▲" : "▼"}
                </span>
              </h3>

              <div
                className={`subsections ${
                  openSections[index] ? "open" : "closed"
                }`}
              >
                {sectionList.some((item) => item.label === section.section) && (
                  <div className="subsection">
                    {sectionList.map((item) =>
                      item.label === section.section ? (
                        <div
                          key={item.path}
                          onClick={() => {
                            if (login) {
                              navigate(
                                `/${item.path}?login=${encodeURIComponent(
                                  login
                                )}`
                              );
                            }
                          }}
                          className={`subsection-content ${
                            login
                              ? location.pathname.includes(item.path)
                                ? "active"
                                : ""
                              : "disabled"
                          }`}
                          title={!login ? "Введите логин" : ""}
                        >
                          Основной
                        </div>
                      ) : null
                    )}
                  </div>
                )}
                {section.subsections &&
                  section.subsections.map((subsection, subIndex) => (
                    <div
                      key={subIndex}
                      className={`subsection ${
                        subsection.subsection === selectedSubsectionName
                          ? "active"
                          : ""
                      }`}
                      onClick={() => openSubsection(subsection.subsection)}
                    >
                      <div className="subsection-content">
                        {subsection.subsection}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <div className="mt-auto">
            <Logout />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
