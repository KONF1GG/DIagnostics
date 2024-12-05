import { useEffect, useState } from "react";
import InfoList from "./InfoList";
import { AxiosError } from "axios";
import { FailureData, GetFailure } from "../../API/Failure";
import "../CSS/Loading.css";
import "../CSS/Network.css";
import { useDataContext } from "../../DataContext/FailureContext";
import { useLocation, useNavigate } from "react-router-dom";
import { getQueryParams } from "./Default/getData";

const Accidents = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    data: FailureData,
    setData: setFailureData,
    login,
    setLogin,
  } = useDataContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const queriedLogin = getQueryParams();

  useEffect(() => {
    if (queriedLogin) {
      if (queriedLogin !== login) {
        setLogin(queriedLogin);
        fetchData(queriedLogin);
      } else if (FailureData) {
        setIsVisible(true);
      }
    } else {
      setError("Логин не указан");
    }
  }, [location.search]);

  const fetchData = async (login: string) => {
    try {
      setLoading(true);
      setIsVisible(false);
      const result = await GetFailure(login);

      if ("isFailure" in result && result.isFailure) {
        setFailureData(result);
      } else {
        setError("Аварии не обнаружены");
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      setError(axiosError.message || "Ошибка при получении данных.");
    } finally {
      setLoading(false);
      setTimeout(() => setIsVisible(true), 200);
    }
  };

  console.log(FailureData);

  return (
    <div>
      <InfoList>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Загрузка данных...</p>
          </div>
        ) : error ? (
          <div className="no-services-message fade-in">{error}</div>
        ) : FailureData && FailureData.failure.length > 0 ? (
          <div className={`container fade-in ${isVisible ? "visible" : ""}`}>
            <div className="fade-in">
              <h2 className="title">Данные об авариях</h2>
              {FailureData.failure.map((failure: FailureData) => (
                <div key={failure.id} className="failure-table">
                  <h3>Авария ID: {failure.id}</h3>
                  <table className="table table-bordered table-striped">
                    <tbody>
                      <tr>
                        <td>Статус</td>
                        <td>{failure.active ? "Активен" : "Неактивен"}</td>
                      </tr>
                      <tr>
                        <td>Хост</td>
                        <td>{failure.host}</td>
                      </tr>
                      <tr>
                        <td>Адрес</td>
                        <td>{failure.address}</td>
                      </tr>
                      <tr>
                        <td>Сообщение</td>
                        <td>{failure.message}</td>
                      </tr>
                      <tr>
                        <td>Дата создания</td>
                        <td>{failure.createdDate}</td>
                      </tr>
                      <tr>
                        <td>Дата изменения</td>
                        <td>{failure.modified_date}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-services-message fade-in">
            Аварии не обнаружены
          </div>
        )}
      </InfoList>
    </div>
  );
};

export default Accidents;
