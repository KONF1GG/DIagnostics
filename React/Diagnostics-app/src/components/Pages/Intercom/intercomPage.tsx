import { useEffect, useState, useCallback } from "react";
import { useDataContext } from "../../../DataContext/IntercomContext";
import InfoList from "../InfoList";
import Loader from "../Default/Loading";
import { getQueryParams } from "../Default/getData";
import { GetIntercom, IntercomResponse } from "../../../API/Intercom";
import "../../CSS/Intercom.css";
import FixManualBlockButton from "./FixManualBlockButton";

interface DataContextType {
  data: IntercomResponse | null;
  setData: (data: IntercomResponse | null) => void;
  login: string | null;
  setLogin: (login: string | null) => void;
}

const IntercomPage = () => {
  const { data, setData, login, setLogin } =
    useDataContext() as DataContextType;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const queriedLogin = getQueryParams();

  const fetchData = useCallback(
    async (login: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await GetIntercom(login);
        if (result && "detail" in result) {
          setError(result.detail);
          setData(null);
        } else if (result) {
          setData(result as IntercomResponse);
        } else {
          setError("Ошибка: данные не получены");
          setData(null);
        }
      } catch {
        setError("Ошибка загрузки данных");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [setData]
  );

  useEffect(() => {
    const fetchDataIfNeeded = async () => {
      if (!queriedLogin) {
        setIsVisible(false);
        return;
      }
      if (queriedLogin !== login) {
        setLogin(queriedLogin);
        await fetchData(queriedLogin);
      }
      setIsVisible(true);
    };
    fetchDataIfNeeded();
  }, [queriedLogin, login, fetchData]);

  if (!queriedLogin && !login) {
    return (
      <div>
        <InfoList>
          <p className="no-services-message fade-in">Логин не указан</p>
        </InfoList>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <InfoList>
          <div className="loader-container">
            <Loader />
          </div>
        </InfoList>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <InfoList>
          <p className="no-services-message fade-in">{error}</p>
        </InfoList>
      </div>
    );
  }

  if (
    !data ||
    (data.errors && data.errors.includes("RBT is disabled for this login")) ||
    (data.categories &&
      data.categories.every((cat) => cat.status === "missing"))
  ) {
    return (
      <div>
        <InfoList>
          <p className="no-services-message fade-in">Домофон не подключен</p>
        </InfoList>
      </div>
    );
  }

  const hasDiscrepancy = data.categories.some(
    (category) => category.status === "discrepancy"
  );

  console.log(data)
  return (
    <div>
      <InfoList>
        <div className={`container fade-in ${isVisible ? "visible" : ""}`}>
          <section>
            <h2 className="title">Услуги</h2>
            {data.errors && data.errors.length > 0 && (
              <div className="error-messages">
                {data.errors.map((err, index) => (
                  <p key={index} className="error-text">
                    {err}
                  </p>
                ))}
              </div>
            )}
          </section>

          <section>
            {data.categories && data.categories.length > 0 ? (
              <table className="table">
                <thead className="table-primary">
                  <tr>
                    <th>Услуга</th>
                    <th>Категория</th>
                    <th>1C</th>
                    <th>Redis</th>
                  </tr>
                </thead>
                <tbody>
                  {data.categories.map((category, index) => (
                    <tr key={index}>
                      <td>{category.service}</td>
                      <td>{category.category}</td>
                      <td
                        className={
                          category.status === "discrepancy"
                            ? "discrepancy-cell"
                            : ""
                        }
                      >
                        {category.timeto_1c
                          ? new Date(
                              category.timeto_1c * 1000
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                      <td
                        className={
                          category.status === "discrepancy"
                            ? "discrepancy-cell"
                            : ""
                        }
                      >
                        {category.timeto_redis
                          ? new Date(
                              category.timeto_redis * 1000
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Нет данных категорий</p>
            )}
            {hasDiscrepancy && (
              <div className="update-instructions">
                <h3 className="update-instructions-title">
                  Инструкция по обновлению данных
                </h3>
                <ol className="update-instructions-list">
                  <li>Зайдите в карточку договора</li>
                  <li>Перейдите в раздел "Управление договором"</li>
                  <li>Откройте вкладку "Логины"</li>
                  <li>Дважды кликните на строку с нужным логином</li>
                  <li>Нажмите "Записать и закрыть"</li>
                </ol>
                <p className="update-instructions-note">
                  Данные автоматически обновятся в течение 5 минут после
                  сохранения.
                </p>
              </div>
            )}
          </section>

          <section>
            <h2 className="title">
              <a
                href={data.rbt_link || "#"}
                className="rbt-link"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Настройки квартиры в
                <span
                  className="rbt-highlight"
                  style={{ display: "inline-flex", alignItems: "center" }}
                >
                  RBT
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    style={{
                      marginLeft: "4px",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </span>
              </a>
            </h2>
            <table className="table">
              <thead className="table-primary">
                <tr>
                  <th>ID</th>
                  <th>Отключена</th>
                  <th>Автоблокировка</th>
                  <th>Код открытия</th>
                  <th>Белый кролик</th>
                  <th>Откл. админом</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{data.aps_settings?.address_house_id || "-"}</td>
                  <td>
                    {data.aps_settings?.manual_block ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span>Да</span>
                        <FixManualBlockButton
                          houseFlatId={data.aps_settings?.house_flat_id}
                          login={login || queriedLogin || ""}
                          onFixed={() => {
                            if (login) fetchData(login);
                          }}
                        />
                      </div>
                    ) : (
                      "Нет"
                    )}
                  </td>
                  <td>{data.aps_settings?.auto_block ? "Да" : "Нет"}</td>
                  <td>{data.aps_settings?.open_code || "-"}</td>
                  <td>{data.aps_settings?.white_rabbit ? "Да" : "Нет"}</td>
                  <td>{data.aps_settings?.admin_block ? "Да" : "Нет"}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="title">Проходы</h2>
            {data.passages && data.passages.length > 0 ? (
              <table className="table">
                <thead className="table-primary">
                  <tr>
                    <th>Дата</th>
                    <th>Адрес</th>
                    <th>Тип</th>
                  </tr>
                </thead>
                <tbody>
                  {data.passages.map((passage, index) => (
                    <tr key={index}>
                      <td>{new Date(passage.date).toLocaleString()}</td>
                      <td>{passage.address}</td>
                      <td>{passage.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Нет данных о проходах</p>
            )}
          </section>
        </div>
      </InfoList>
    </div>
  );
};

export default IntercomPage;
