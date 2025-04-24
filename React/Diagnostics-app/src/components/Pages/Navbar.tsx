import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../CSS/Navbar.css";
import { LoginData } from "../../API/getSearchLogins";
import { GetSearchLogins } from "../../API/getSearchLogins";
import userIcon from "../../assets/users.svg";
import debounce from "lodash/debounce";
import MenuButton from "./Default/MenuOpen";
import { useSidebar } from "../../DataContext/SidebarContext";
import formatDateTime from "./Default/formatDateTime";
import CheckIcon from "@mui/icons-material/Check";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import Chip from "@mui/material/Chip";
export const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <button onClick={handleLogout} className="Btn">
      <div className="sign">
        <svg viewBox="0 0 512 512">
          <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
        </svg>
      </div>
      <div className="text">Выйти</div>
    </button>
  );
};

const Navbar = () => {
  const location = useLocation();
  const [login, setLogin] = useState<string>("");
  const [loginsList, setLoginsList] = useState<LoginData[]>([]);
  const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const navigate = useNavigate();
  const { setIsSidebarOpen } = useSidebar();
  const { searchedLogin, setSearchedLogin } = useSidebar();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchLogins = useCallback(
    debounce(async (query: string) => {
      try {
        const result = await GetSearchLogins(query);
        if ("logins" in result) {
          setLoginsList(
            result.logins.map((item) => ({
              login: item.login,
              name: item.name,
              contract: item.contract,
              address: item.address,
              timeTo: item.timeTo,
            }))
          );
        } else {
          setLoginsList([]);
        }
      } catch (err) {
        setLoginsList([]);
      } finally {
      }
    }, 1500),
    []
  );

  useEffect(() => {
    if (login.length > 2) {
      fetchLogins(login);
      setDropdownOpen(true);
    } else {
      setLoginsList([]);
      setDropdownOpen(false);
    }
  }, [login, fetchLogins]);

  useEffect(() => {
    if (loginsList.length === 1) {
      setSearchedLogin(loginsList[0]);
      handleLoginSearchChoice(loginsList[0].login);
    }
  }, [loginsList]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const loginParam = params.get("login");
    if (loginParam) {
      setLogin(loginParam);
    }
  }, [location.search]);

  const handleLoginSearchChoice = (value: string) => {
    const previousUrl = location.pathname;
    const searchParams = new URLSearchParams(location.search);

    if (previousUrl.includes("/subsection")) {
      searchParams.set("login", encodeURIComponent(value));
      const updatedUrl = `${previousUrl}?${searchParams.toString()}`;
      navigate(updatedUrl);
    } else {
      const redirectUrl =
        previousUrl === "/" && !searchedLogin?.login
          ? `/network?login=${encodeURIComponent(value)}`
          : `${previousUrl}?login=${encodeURIComponent(value)}`;
      navigate(redirectUrl);
    }
    setLoginsList([]);
    setDropdownOpen(false);

    const searchInput = document.querySelector(
      ".combobox-input"
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.blur();
    }
  };

  const getContractStatus = (timeTo?: string | number) => {
    if (!timeTo) {
      return {
        className: "status-red",
        icon: <RemoveCircleOutlineIcon fontSize="small" />,
      };
    }

    const now = new Date();
    const timeToDate =
      typeof timeTo === "number" ? new Date(timeTo * 1000) : new Date(timeTo);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(now.getDate() - 10);

    if (timeToDate > now) {
      return {
        className: "status-green",
        icon: <CheckIcon fontSize="small" />,
      };
    }

    if (timeToDate > tenDaysAgo) {
      return {
        className: "status-yellow",
        icon: <StopCircleIcon fontSize="small" />,
      };
    }

    if (timeToDate > threeMonthsAgo) {
      return {
        className: "status-orange",
        icon: <RemoveCircleOutlineIcon fontSize="small" />,
      };
    }

    return {
      className: "status-red",
      icon: <RemoveCircleOutlineIcon fontSize="small" />,
    };
  };

  const highlightMatch = useCallback((text: string, query: string) => {
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, `<mark>$1</mark>`);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (loginsList.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        setActiveIndex((prev) => {
          const newIndex = (prev + 1) % loginsList.length;
          const activeItem =
            document.querySelectorAll(".dropdown-item")[newIndex];
          if (activeItem) {
            activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
          return newIndex;
        });
        break;
      case "ArrowUp":
        setActiveIndex((prev) => {
          const newIndex = (prev - 1 + loginsList.length) % loginsList.length;
          const activeItem =
            document.querySelectorAll(".dropdown-item")[newIndex];
          if (activeItem) {
            activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
          return newIndex;
        });
        break;
      case "Enter":
        if (activeIndex >= 0 && activeIndex < loginsList.length) {
          handleLoginSearchChoice(loginsList[activeIndex].login);
        }
        break;
      case "Escape":
        setDropdownOpen(false);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <MenuButton onClick={toggleSidebar} />
        <div className="search-container-nav mx-auto" ref={dropdownRef}>
          <div
            className={`input-wrapper-nav ${
              isDropdownOpen && loginsList.length > 0 ? "dropdown-open" : ""
            }`}
          >
            <input
              type="text"
              placeholder="Поиск..."
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              className="combobox-input"
            />
            {/* <button className="search-btn">
              <i className="fas fa-search" />
            </button> */}
          </div>

          {isDropdownOpen && loginsList.length > 0 && (
            <ul className="dropdown-container show">
              {loginsList.map((loginItem, index) => (
                <li
                  key={index}
                  className={`dropdown-item ${
                    activeIndex === index ? "active" : ""
                  }`}
                  onClick={() => handleLoginSearchChoice(loginItem.login)}
                >
                  <div className="dropdown-item-details">
                    <span
                      className="dropdown-item-field login"
                      dangerouslySetInnerHTML={{
                        __html: highlightMatch(loginItem.login, login),
                      }}
                    ></span>
                    <span
                      className="dropdown-item-field name"
                      dangerouslySetInnerHTML={{
                        __html: highlightMatch(loginItem.name, login),
                      }}
                    ></span>
                    <span
                      className="dropdown-item-field address"
                      dangerouslySetInnerHTML={{
                        __html: highlightMatch(loginItem.address, login),
                      }}
                    ></span>
                    <span
                      className="dropdown-item-field contract"
                      dangerouslySetInnerHTML={{
                        __html: highlightMatch(loginItem.contract, login),
                      }}
                    ></span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div
          className="d-flex align-items-center hidden-on-small"
          style={{ width: "500px", margin: "15px", paddingTop: "15px" }}
        >
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              flexDirection: "column",
            }}
          >
            <div
              className={`contract-status ${
                getContractStatus(searchedLogin?.timeTo)?.className
              }`}
              style={{ marginRight: "15px" }}
            >
              {getContractStatus(searchedLogin?.timeTo)?.icon}
            </div>

            {searchedLogin?.timeTo && (
              <div className="popup-tooltip">
                <div className="tooltip-content">
                  {getContractStatus(searchedLogin.timeTo)?.className.includes(
                    "green"
                  ) ? (
                    <>
                      Действует до:{" "}
                      <strong>{formatDateTime(searchedLogin.timeTo)}</strong>
                    </>
                  ) : (
                    <>
                      Истёк:{" "}
                      <strong>{formatDateTime(searchedLogin.timeTo)}</strong>
                    </>
                  )}
                  <div className="tooltip-tail"></div>
                </div>
              </div>
            )}
          </div>

          <div className="d-flex flex-column">
            <strong>{searchedLogin?.name}</strong>
            <p>{searchedLogin?.address}</p>
          </div>
        </div>
        <div className="profile-icon" onClick={() => navigate("/users")}>
          <img src={userIcon} style={{ height: "50px", cursor: "pointer" }} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
