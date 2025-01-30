import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import jsonData from "./../../../FileData/diagnosticHelper.json";
import InfoList from "../../InfoList";
import "./GeneralSubsection.css";
import { useDataContext } from "../../../../DataContext/RedisLoginDataContext";
import { Get } from "./requests";

const SubsectionPage: React.FC = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const selectedSubsectionName = query.get("subsection");
  const queriedLogin = query.get("login");
  const { loginData, setLoginData } = useDataContext();

  // Находим данные для выбранного subsection
  const selectedSubsection = jsonData
    .flatMap((section) => section.subsections || [])
    .find((subsection) => subsection.subsection === selectedSubsectionName);

  if (!selectedSubsection) {
    return (
      <InfoList>
        <div className="container">
          <h3>Подраздел не найден</h3>
        </div>
      </InfoList>
    );
  }

  // Функция для преобразования текста с шаблонами и ссылками
  const renderText = (text: string) => {
    const linkRegex = /https?:\/\/[^\s]+/g;
    const templateRegex = /<redis\.login\.(\w+)>/g;

    // Заменяем шаблоны
    const replacedText = text.replace(templateRegex, (match, key) => {
      if (loginData && key in loginData) {
        return loginData[key];
      }
      return match; // Если данные отсутствуют, оставляем шаблон как есть
    });

    // Разделяем текст на строки и обрабатываем ссылки
    return replacedText.split("\n").map((line, index) => (
      <React.Fragment key={index}>
        {line.split(linkRegex).map((chunk, i) => (
          <React.Fragment key={i}>
            {chunk}
            {line.match(linkRegex) && line.match(linkRegex)![i] && (
              <a
                href={line.match(linkRegex)![i]}
                target="_blank"
                rel="noopener noreferrer"
              >
                {line.match(linkRegex)![i]}
              </a>
            )}
          </React.Fragment>
        ))}
        <br />
      </React.Fragment>
    ));
  };

  useEffect(() => {
    if (queriedLogin) {
      if (loginData) {
        if (loginData.login !== queriedLogin) {
          Get(queriedLogin, setLoginData);
        }
      } else {
        Get(queriedLogin, setLoginData);
      }
    }
  }, [queriedLogin, loginData]);

  return (
    <InfoList>
      <div className="container">
        <h2 className="title">{selectedSubsection.subsection}</h2>
        <div className="card-list">
          {selectedSubsection.items.map((item, index) => {
            const isLarge = item.text.length > 200;
            return (
              <div
                className={`card ${isLarge ? "card-large" : "card-regular"}`}
                key={index}
              >
                <h4 className="card-title">{item.name}</h4>
                <p className="card-text">{renderText(item.text)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </InfoList>
  );
};

export default SubsectionPage;
