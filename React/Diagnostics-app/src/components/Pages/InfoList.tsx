import React, { useState, useEffect, useRef } from "react";
import { GetSearchLogins, LoginData } from "../../API/getSearchLogins";
import { AxiosError } from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import SideMenu from "./SideMenu";
import "../CSS/infoList.css";

interface InfoListProps {
  children: React.ReactNode;
}

const InfoList: React.FC<InfoListProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [login, setLogin] = useState<string>("");
  const [loginsList, setLoginsList] = useState<LoginData[]>([]);
  const [error, setError] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogin(e.target.value);
  };

  useEffect(() => {
    if (login.length > 2) {
      const fetchLogins = async () => {
        try {
          const result = await GetSearchLogins(login);
          if ("logins" in result) {
            setLoginsList(
              result.logins.map((item) => ({
                login: item.login,
                name: item.name,
                contract: item.contract,
                address: item.address,
              }))
            );
            setError("");
          } else {
            setLoginsList([]);
            setError(result.message);
          }
        } catch (err) {
          setLoginsList([]);
          setError((err as AxiosError).message || "Ошибка при запросе.");
        }
      };
      fetchLogins();
    } else {
      setLoginsList([]);
      setError("");
    }
  }, [login]);

  const handleLoginSearchChoice = (chosenLogin?: string) => {
    if (login) {
      if (location.pathname === "/") {
        const redirectUrl = chosenLogin
          ? `network?login=${chosenLogin}`
          : `network?login=${encodeURIComponent(login)}`;
        navigate(redirectUrl);
        setLoginsList([]);
      } else {
        const redirectUrl = chosenLogin
          ? `${location.pathname}?login=${chosenLogin}`
          : `${location.pathname}?login=${encodeURIComponent(login)}`;
        navigate(redirectUrl);
        setLoginsList([]);
      }
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const shouldShowDropdown = loginsList.length > 0 && (isFocused || isHovered);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setLogin(queryParams.get("login") || "");
  }, [location]);

  return (
    <div className="info-list-layout">
      <SideMenu login={login} />

      <div className="content-wrapper">
        <div className="search-container">
          <div className="input-wrapper">
            <input
              id="loginInput"
              type="text"
              placeholder="Введите логин"
              value={login}
              onChange={handleInputChange}
              className="form-control"
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={(event) =>
                event.key === "Enter" && handleLoginSearchChoice()
              }
              ref={inputRef}
            />
            <button
              onClick={() => handleLoginSearchChoice()}
              className="btn-outline-primary"
              disabled={!login}
            >
              <i className="fas fa-search" />
            </button>
          </div>

          {shouldShowDropdown && (
            <div
              className={`dropdown-container ${
                shouldShowDropdown ? "show" : ""
              }`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
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
        {error && <div className="alert alert-danger">{error}</div>}

        {children}
      </div>
    </div>
  );
};

export default InfoList;
