import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "../CSS/Navbar.css"; // Импортируем файл стилей
import { LoginData } from "../../API/getSearchLogins";
import { GetSearchLogins } from "../../API/getSearchLogins";
import userIcon from "../../assets/users.svg";
import debounce from "lodash/debounce"; // Подключаем lodash для дебаунса

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [login, setLogin] = useState<string>(""); // Текущее значение инпута
  const [loginsList, setLoginsList] = useState<LoginData[]>([]); // Список найденных логинов
  const navigate = useNavigate();

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleLoginSearchChoice = (chosenLogin?: string) => {
    if (login) {
      const redirectUrl = chosenLogin
        ? `network?login=${chosenLogin}`
        : `network?login=${encodeURIComponent(login)}`;
      navigate(redirectUrl);
      setLoginsList([]);
    }
  };

  // Функция поиска логинов с дебаунсом
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
    }, 500), // 500 мс задержка
    []
  );

  useEffect(() => {
    if (login.length > 2) {
      fetchLogins(login); // Вызываем функцию с дебаунсом
    } else {
      setLoginsList([]); // Очищаем список, если введено меньше 3 символов
    }
  }, [login, fetchLogins]);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <Link className="navbar-brand" to="/">
            <img src={logo} alt="Логотип" style={{ height: "40px" }} />
          </Link>
          <div className="search-container-nav mx-auto">
            <div className="input-wrapper-nav">
              <input
                type="text"
                placeholder="Поиск..."
                value={login}
                onChange={(e) => setLogin(e.target.value)} // Обновляем состояние
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleLoginSearchChoice()
                }
              />
              <button
                onClick={() => handleLoginSearchChoice()}
                className="search-btn"
                disabled={!login}
              >
                <i className="fas fa-search" />
              </button>
            </div>
            {loginsList.length > 0 && (isFocused || isHovered) && (
              <div
                className={`dropdown-container ${
                  isFocused || isHovered ? "show" : ""
                }`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <ul className="dropdown-list">
                  {loginsList.map((loginItem, index) => (
                    <li
                      key={index}
                      className="dropdown-item"
                      onClick={() => {
                        setLogin(loginItem.login);
                        setLoginsList([]);
                        handleLoginSearchChoice(loginItem.login);
                      }}
                    >
                      <div className="dropdown-item-details">
                        <span className="dropdown-item-field login">
                          Логин: {loginItem.login}
                        </span>
                        <span className="dropdown-item-field name">
                          Имя: {loginItem.name}
                        </span>
                        <span className="dropdown-item-field contract">
                          Договор: {loginItem.contract}
                        </span>
                        <span className="dropdown-item-field address">
                          Адрес: {loginItem.address}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
