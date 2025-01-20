import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "../CSS/Navbar.css";
import { LoginData } from "../../API/getSearchLogins";
import { GetSearchLogins } from "../../API/getSearchLogins";
import userIcon from "../../assets/users.svg";
import debounce from "lodash/debounce"; // Подключаем lodash для дебаунса
import { Combobox } from "@headlessui/react";
import MenuButton from "./Default/MenuOpen";
import { useSidebar } from "../../DataContext/SidebarContext";
import toggleSidebar from "../Pages/SideMenu";

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
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

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
            }))
          );
        } else {
          setLoginsList([]);
        }
      } catch (err) {
        setLoginsList([]);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (login.length > 2) {
      fetchLogins(login);
    } else {
      setLoginsList([]);
    }
  }, [login, fetchLogins]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const loginParam = params.get("login");
    if (loginParam) {
      setLogin(loginParam);
    }
  }, [location.search]);

  const handleLoginSearchChoice = (value: string | null) => {
    if (value) {
      const previousUrl = location.pathname;
      const redirectUrl =
        previousUrl === "/"
          ? `/network?login=${encodeURIComponent(value)}`
          : `${previousUrl}?login=${encodeURIComponent(value)}`;
      navigate(redirectUrl);
      setLoginsList([]);
    }
  };

  const highlightMatch = useCallback((text: string, query: string) => {
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      console.log(prev);
      return !prev;
    });
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <MenuButton onClick={toggleSidebar} />
          <div className="search-container-nav mx-auto">
            <Combobox value={login} onChange={handleLoginSearchChoice}>
              <div className="input-wrapper-nav">
                <Combobox.Input
                  placeholder="Поиск..."
                  onChange={(event) => setLogin(event.target.value)}
                  className="combobox-input"
                />
                <Combobox.Button className="search-btn">
                  <i className="fas fa-search" />
                </Combobox.Button>
              </div>
              {loginsList.length > 0 && (
                <Combobox.Options className="dropdown-container show">
                  {loginsList.map((loginItem, index) => (
                    <Combobox.Option
                      key={index}
                      value={loginItem.login}
                      as="li"
                      className="dropdown-item"
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
                          className="dropdown-item-field contract"
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(loginItem.contract, login),
                          }}
                        ></span>
                        <span
                          className="dropdown-item-field address"
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(loginItem.address, login),
                          }}
                        ></span>
                      </div>
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              )}
            </Combobox>
          </div>
          <div className="profile-icon" onClick={() => navigate("/users")}>
            <img src={userIcon} style={{ height: "40px", cursor: "pointer" }} />
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
