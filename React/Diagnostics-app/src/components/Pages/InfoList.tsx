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
    <div className="d-flex flex-column align-items-center mt-4">
      <input
        id="loginInput"
        type="text"
        placeholder="Введите логин"
        value={login}
        onChange={handleInputChange}
        className="form-control mb-3"
        style={{
          width: "300px",
          borderRadius: "4px",
          border: "1px solid #ced4da",
          padding: "10px",
          transition: "border-color 0.3s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#80bdff";
          e.currentTarget.style.boxShadow = "0 0 0 0.2rem rgba(0,123,255,.25)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#ced4da";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <button
        onClick={handleSearch}
        className="btn btn-primary mb-3"
        style={{ width: "300px" }}
        disabled={!login}
      >
        Найти
      </button>
      <div className="d-flex flex-row">
        {["network", "accidents", "cameras", "TV"].map((path, index) => (
          <Link
            key={path}
            to={
              login ? `/${path}?login=${encodeURIComponent(login)}` : `/${path}`
            }
            className={`nav-link ${
              location.pathname === `/${path}` ? "fw-bold" : ""
            }`}
            style={{
              color: location.pathname === `/${path}` ? "#007bff" : "#000",
              textDecoration: "none",
              marginRight: index < 3 ? "10px" : "0", // Последний элемент без отступа
              transition: "text-decoration 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {path === "network"
              ? "Сеть"
              : path === "accidents"
              ? "Аварии"
              : path === "cameras"
              ? "Камеры"
              : "ТВ"}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default InfoList;
