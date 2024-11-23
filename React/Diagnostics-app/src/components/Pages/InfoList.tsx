import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const InfoList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [login, setLogin] = useState("");

  // Обработка изменения ввода
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogin(e.target.value);
  };

  // Обработка поиска
  const handleSearch = () => {
    if (login) {
      let redirectUrl = "";
      switch (location.pathname) {
        case "/":
          redirectUrl = `/network?login=${encodeURIComponent(login)}`;
          break;
        case "/accidents":
          redirectUrl = `/accidents?login=${encodeURIComponent(login)}`;
          break;
        case "/cameras":
          redirectUrl = `/cameras?login=${encodeURIComponent(login)}`;
          break;
        case "/TV":
          redirectUrl = `/TV?login=${encodeURIComponent(login)}`;
          break;
        case "/app":
          redirectUrl = `/app?login=${encodeURIComponent(login)}`;
          break;
        default:
          redirectUrl = `/network?login=${encodeURIComponent(login)}`; // По умолчанию
      }

      navigate(redirectUrl);
    }
  };

  // Эффект для получения логина из параметров запроса
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.has("login")) {
      setLogin(queryParams.get("login") || "");
    } else {
      setLogin(""); // Сбрасываем логин, если его нет
    }
  }, [location]);

  return (
    <div className="container mt-4">
      {/* Поисковая форма */}
      <div className="container mt-4">
        <div
          className="d-flex justify-content-center align-items-center mb-4"
          style={{ gap: "10px" }}
        >
          <input
            id="loginInput"
            type="text"
            placeholder="Введите логин"
            value={login}
            onChange={handleInputChange}
            className="form-control"
            style={{ maxWidth: "300px" }}
          />
          <button
            onClick={handleSearch}
            className="btn btn-outline-primary"
            disabled={!login}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "20%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "0",
            }}
          >
            <i className="fas fa-search" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      {/* Вкладки навигации */}
      <ul className="nav nav-tabs justify-content-center mb-3">
        {[
          { path: "network", label: "Сеть" },
          { path: "accidents", label: "Аварии" },
          { path: "cameras", label: "Камеры" },
          { path: "TV", label: "ТВ" },
          { path: "app", label: "Приложение" },
        ].map(({ path, label }) => (
          <li key={path} className="nav-item">
            <Link
              to={
                login
                  ? `/${path}?login=${encodeURIComponent(login)}`
                  : `/${path}`
              }
              className={`nav-link ${
                location.pathname === `/${path}` ? "active" : ""
              }`}
              style={{
                transition: "color 0.3s, text-decoration 0.3s",
              }}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InfoList;
