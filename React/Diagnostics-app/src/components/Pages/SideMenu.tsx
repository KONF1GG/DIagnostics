import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logout } from "./Navbar";
import "../CSS/SideMenu.css";
import { useSidebar } from "../../DataContext/SidebarContext";
import jsonData from "./../../components/FileData/diagnosticHelper.json";

interface SidebarProps {
  login: string;
}

const Sidebar: React.FC<SidebarProps> = ({ login }) => {
  const [sections, setSections] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>(
    {}
  );
  const location = useLocation();
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate(); // Хук для перехода по ссылкам
  const sectionList = [
    { path: "network", label: "Сеть" },
    { path: "accidents", label: "Аварии" },
    { path: "cameras", label: "Камеры" },
    { path: "TV", label: "ТВ" },
    { path: "app", label: "Приложение" },
  ];

  useEffect(() => {
    setSections(jsonData);
    setOpenSections(
      jsonData.reduce((acc, _, index) => ({ ...acc, [index]: false }), {})
    ); // По умолчанию все секции закрыты
  }, []);

  const toggleSection = (index: number) => {
    setOpenSections((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  return (
    <div className="d-flex">
      <div className={`side-menu-wrapper ${isSidebarOpen ? "open" : ""}`}>
        <div className="side-menu">
          {sections.map((section, index) => (
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
                            location.pathname.includes(item.path)
                              ? "active"
                              : ""
                          }`}
                        >
                          Основной
                        </div>
                      ) : null
                    )}
                  </div>
                )}
                {section.subsections &&
                  section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} className="subsection">
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
