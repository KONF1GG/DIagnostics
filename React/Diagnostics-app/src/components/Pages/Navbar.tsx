import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "../CSS/Navbar.css"; // Импортируем файл стилей

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="btn btn-danger"
      style={{ padding: "10px 20px", borderRadius: "5px" }}
    >
      Выйти
    </button>
  );
};

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBottomNavbarVisible, setIsBottomNavbarVisible] = useState(false);

  // Функция для проверки прокрутки страницы
  const checkScrollPosition = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      setIsBottomNavbarVisible(true);
    } else {
      setIsBottomNavbarVisible(false);
    }
  };

  // Отслеживаем прокрутку
  useEffect(() => {
    window.addEventListener("scroll", checkScrollPosition);
    return () => {
      window.removeEventListener("scroll", checkScrollPosition);
    };
  }, []);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
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
                      location.pathname === "/" ? "#007bff" : "#e9ecef",
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
                      location.pathname === "/users" ? "#007bff" : "#e9ecef",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    transition: "background-color 0.3s",
                  }}
                >
                  Пользователи
                </Link>
              </li>
            </ul>
            <div className="d-flex">
              <Logout />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
