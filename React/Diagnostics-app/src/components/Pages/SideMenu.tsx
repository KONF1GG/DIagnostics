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
  const { openSections, toggleSection } = useSidebarContext(); 
  const { searchedLogin } = useSidebar();

  const sectionList = [
    { path: "network", label: "Сеть" },
    { path: "accidents", label: "Аварии" },
    { path: "cameras", label: "Камеры" },
    { path: "TV", label: "ТВ" },
    { path: "app", label: "Приложение" },
    { path: "payments", label: "Оплата"},
  ];

  const query = new URLSearchParams(location.search);
  const selectedSubsectionName = query.get("subsection");

  const openSubsection = (subsectionName: string) => {
    const url = `/subsection?subsection=${encodeURIComponent(
      subsectionName
    )}&login=${encodeURIComponent(login)}`;
    navigate(url);
  };

  const handleSectionClick = (section: any, index: number) => {
    const isMatchedSection = sectionList.find(
      (item) => item.label === section.section
    );

    // Проверяем, если секция имеет ссылку или нет
    const hasLink = isMatchedSection && isMatchedSection.path;
    const isActiveSection = hasLink
      ? location.pathname.includes(isMatchedSection.path) // Если есть путь, то проверяем его
      : false;

    // Определяем значение для параметра login
    const loginValue = searchedLogin?.login
      ? encodeURIComponent(searchedLogin.login)
      : encodeURIComponent(login);

    if (openSections[index]) {
      // Если секция открыта
      if (isActiveSection) {
        // Если секция активная, то закрываем её
        toggleSection(index);
      } else {
        // Если секция не активная, то переходим по ссылке и выполняем запрос
        if (hasLink) {
          navigate(`/${isMatchedSection.path}?login=${loginValue}`);
        } else {
          toggleSection(index);
        }
      }
    } else {
      // Если секция закрыта
      toggleSection(index);
      if (hasLink) {
        // Если секция привязана к ссылке, переходим по ней
        navigate(`/${isMatchedSection.path}?login=${loginValue}`);
      }
    }
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
                  onClick={() => handleSectionClick(section, index)}
                >
                  {section.section}
                  <span
                    className={`toggle-icon ${
                      openSections[index] ? "open" : ""
                    }`}
                  >
                    {openSections[index] ? "▲" : "▼"}
                  </span>
                </h3>

                <div
                  className={`subsections ${
                    openSections[index] ? "open" : "closed"
                  }`}
                >
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
