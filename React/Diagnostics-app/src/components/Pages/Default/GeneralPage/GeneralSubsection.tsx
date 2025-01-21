import React from "react";
import { useLocation } from "react-router-dom";
import jsonData from "./../../../FileData/diagnosticHelper.json";
import InfoList from "../../InfoList";
import "./GeneralSubsection.css";

const SubsectionPage: React.FC = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const selectedSubsectionName = query.get("subsection");

  // Находим данные для выбранного subsection
  const selectedSubsection = jsonData
    .flatMap((section) => section.subsections || [])
    .find((subsection) => subsection.subsection === selectedSubsectionName);

  if (!selectedSubsection) {
    return <p>Секция не найдена.</p>;
  }

  // Функция для преобразования текста с ссылками
  const renderTextWithLinks = (text: string) => {
    const linkRegex = /https?:\/\/[^\s]+/g; // Регулярное выражение для поиска ссылок
    return text.split("\n").map((line, index) => (
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
                <p className="card-text">{renderTextWithLinks(item.text)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </InfoList>
  );
};

export default SubsectionPage;
