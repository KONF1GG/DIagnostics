import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

  // Парсим query-параметры
  const query = new URLSearchParams(location.search);
  const selectedSubsectionName = query.get("subsection");

  const openSubsection = (subsectionName: string) => {
    const url = `/subsection?subsection=${encodeURIComponent(subsectionName)}&login=${encodeURIComponent(login)}`;
    navigate(url);
  };

  return (
    <div className="d-flex">
      <div className={`side-menu-wrapper ${isSidebarOpen ? "open" : ""}`}>
        <div className="side-menu">
          {jsonData.map((section, index) => {
            const isMatchedSection = sectionList.find(
              (item) => item.label === section.section
            );
            
            // Проверяем, если секция имеет ссылку или нет
            const hasLink = isMatchedSection && isMatchedSection.path;

            // Если секция имеет ссылку, то проверяем активность на основе текущего пути
            const isActiveSection = hasLink
              ? location.pathname.includes(isMatchedSection.path) // Если есть путь, то проверяем его
              : false;

            return (
              <div key={index} className="section">
                <h3
                  className={`section-title ${isActiveSection ? "active" : ""}`}
                  onClick={() => {
                    if (openSections[index]) {
                      // Если секция открыта
                      toggleSection(index);
                    } else {
                      // Если секция закрыта
                      toggleSection(index);
                      if (hasLink) {
                        // Если секция привязана к ссылке, переходим по ней
                        navigate(`/${isMatchedSection.path}?login=${encodeURIComponent(login)}`);
                      }
                    }
                  }}
                >
                  {section.section}
                  <span className={`toggle-icon ${openSections[index] ? "open" : ""}`}>
                    {openSections[index] ? "▲" : "▼"}
                  </span>
                </h3>

                <div className={`subsections ${openSections[index] ? "open" : "closed"}`}>
                  {section.subsections &&
                    section.subsections.map((subsection, subIndex) => (
                      <div
                        key={subIndex}
                        className={`subsection ${
                          subsection.subsection === selectedSubsectionName ? "active" : ""
                        }`}
                        onClick={() => openSubsection(subsection.subsection)}
                      >
                        <div className="subsection-content">{subsection.subsection}</div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
          <div className="mt-auto">
            <Logout />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
