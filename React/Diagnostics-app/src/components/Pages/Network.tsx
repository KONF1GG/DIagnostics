import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GetNetwork } from "../../API/network";
import InfoList from "./InfoList";
import "../CSS/Network.css";
import "../CSS/Loading.css";
import { useDataContext } from "../../DataContext/NetworkContext";
import { getQueryParams } from "./Deafault/getData";

interface Differences {
  radius: Record<string, unknown>;
  redis: Record<string, unknown>;
}

const Network = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    data: networkData,
    setData: setNetworkData,
    login,
    setLogin,
  } = useDataContext();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const queriedLogin = getQueryParams();

  useEffect(() => {
    if (queriedLogin !== login) {
      setLogin(queriedLogin);
      fetchNetworkData(queriedLogin);
    } else if (networkData) {
      setIsVisible(true);
    }
  }, [location.search, login, networkData]);

  const fetchNetworkData = async (login: string) => {
    setLoading(true);
    setIsVisible(false);
    setError(null);
    try {
      const result = await GetNetwork(login);
      if (typeof result === "string") {
        setError(result);
        navigate("/login");
      } else {
        setNetworkData(result);
      }
    } catch (err) {
      setError("Произошла ошибка при получении данных.");
    } finally {
      setLoading(false);
      setTimeout(() => setIsVisible(true), 200);
    }
  };

  const combinedData = networkData
    ? [
        {
          parameter: "Active",
          redius: networkData.radius?.active ? "Да" : "Нет",
          redis: networkData.redis?.active ? "Да" : "Нет",
        },
        {
          parameter: "IP адрес",
          redius: networkData.radius?.ip_addr ?? "-",
          redis: networkData.redis?.ip_addr ?? "-",
        },
        {
          parameter: "GMT",
          redius: networkData.radius?.GMT ?? "-",
          redis: networkData.redis?.GMT ?? "-",
        },
        {
          parameter: "ONU MAC",
          redius: networkData.radius?.onu_mac ?? "-",
          redis: networkData.redis?.onu_mac ?? "-",
        },
        {
          parameter: "MAC",
          redius: networkData.radius?.json_data?.mac ?? "-",
          redis: networkData.redis?.mac ?? "-",
        },
        {
          parameter: "VLAN",
          redius: networkData.radius?.json_data?.vlan ?? "-",
          redis: networkData.redis?.vlan ?? "-",
        },
        {
          parameter: "Time To",
          redius: networkData.radius?.time_to ?? "-",
          redis: networkData.redis?.servicecats?.internet?.timeto ?? "-",
        },
      ]
    : [];

  const differences = networkData?.differences
    ? (networkData.differences as unknown as Differences)
    : { radius: {}, redis: {} };

  return (
    <div>
      <InfoList />
      {!queriedLogin && !login ? (
        <p className="no-services-message fade-in">Логин не указан</p>
      ) : loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      ) : (
        <div className={`container ${isVisible ? "fade-in" : "fade-out"}`}>
          <h2 className="title fade-in">Данные о подключении</h2>
          {combinedData.length > 0 ? (
            <table className="table table-bordered table-striped">
              <thead className="table-primary">
                <tr>
                  <th>Параметр</th>
                  <th>Redius</th>
                  <th>Redis</th>
                </tr>
              </thead>
              <tbody>
                {combinedData.map((data, index) => (
                  <tr key={index} className="user-row">
                    <td>{data.parameter}</td>
                    <td>{data.redius}</td>
                    <td>{data.redis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>Нет данных для отображения</div>
          )}

          {(Object.keys(differences.radius).length > 0 ||
            Object.keys(differences.redis).length > 0) && (
            <div>
              <h2 className="title-red text-danger fade-in">Различия:</h2>
              <table className="table table-bordered table-striped">
                <thead className="table-danger">
                  <tr>
                    <th>Параметр</th>
                    <th>Radius</th>
                    <th>Redis</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(differences.radius).map((key) => {
                    const radiusValue = differences.radius[key] ?? "-";
                    const redisValue = differences.redis[key] ?? "-";
                    return (
                      <tr key={key} className="user-row">
                        <td>{key}</td>
                        <td>{String(radiusValue)}</td>
                        <td>{String(redisValue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Network;
