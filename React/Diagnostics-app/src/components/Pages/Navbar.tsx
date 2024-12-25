import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "../CSS/Navbar.css"; // Импортируем файл стилей
import { LoginData } from "../../API/getSearchLogins";

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
  const [login, setLogin] = useState<string>("");
  const [loginsList, setLoginsList] = useState<LoginData[]>([]);
  const navigate = useNavigate();

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogin(e.target.value);
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

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <Link className="navbar-brand" to="/">
            <img src={logo} alt="Логотип" style={{ height: "40px" }} />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            onClick={handleMenuToggle}
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className={`collapse navbar-collapse ${isMenuOpen ? "show" : ""}`}
            id="navbarNav"
          >
            <ul className="navbar-nav me-auto">
              <li className="nav-item me-3 item">
                <Link
                  className={`nav-link ${
                    location.pathname === "/"
                      ? "fw-bold text-white"
                      : "text-dark"
                  }`}
                  to="/"
                  onClick={handleLinkClick}
                  style={{
                    backgroundColor:
                      location.pathname === "/" ? "#02458d" : "#e9ecef",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    transition: "background-color 0.3s",
                  }}
                >
                  Главная
                </Link>
              </li>
              <li className="nav-item item">
                <Link
                  className={`nav-link ${
                    location.pathname === "/users"
                      ? "fw-bold text-white"
                      : "text-dark"
                  }`}
                  to="/users"
                  onClick={handleLinkClick}
                  style={{
                    backgroundColor:
                      location.pathname === "/users" ? "#02458d" : "#e9ecef",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    transition: "background-color 0.3s",
                  }}
                >
                  Пользователи
                </Link>
              </li>
            </ul>

            <div className="search-container-nav">
              <div className="input-wrapper-nav">
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={login}
                  onChange={handleInputChange}
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
              {/* Выпадающий список */}
              {loginsList.length > 0 && (isFocused || isHovered) && (
                <div className="navbar-dropdown">
                  {/* ... содержимое выпадающего списка ... */}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
