import { useEffect, useState } from "react";
import { useDataContext } from "../../../DataContext/AppContext";
import { GetApp } from "../../../API/App";
import { getQueryParams } from "../Default/getData";
import InfoList from "../InfoList";
import "../../CSS/App.css";

const App_page = () => {
  const { data, setData, login, setLogin } = useDataContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const queriedLogin = getQueryParams();

  // Функция загрузки данных
  const fetchData = async (login: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await GetApp(login);

      if (result && "detail" in result) {
        console.log(result);
        setError(result.detail);
        setData(null);
      } else if (result) {
        setData(result);
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
  };

  useEffect(() => {
    const fetchDataIfNeeded = async () => {
      if (queriedLogin !== login) {
        setLogin(queriedLogin);
        await fetchData(queriedLogin);
      }

      setIsVisible(!!queriedLogin || !!login);
    };

    fetchDataIfNeeded();
  }, [queriedLogin, login]);

  if (!queriedLogin && !login) {
    return (
      <div>
        <InfoList />
        <p className="no-services-message fade-in">Логин не указан</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <InfoList />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <InfoList />
        <p className="no-services-message fade-in">{error}</p>
      </div>
    );
  }

  console.log(data);
  if (!data) {
    return (
      <div>
        <InfoList />
        <p className="no-services-message fade-in">
          Договор не зарегестрирван в приложении
        </p>
      </div>
    );
  }

  return (
    <div>
      <InfoList />
      <div className={`container fade-in ${isVisible ? "visible" : ""}`}>
        <div className="bg-gradient bg-secondary text-center p-3 rounded mb-4">
          <h2>{data.address_in_app}</h2>
        </div>

        {/* Contracts */}
        <h2 className="title">Договоры на адресе</h2>
        <table className="table">
          <thead className="table-primary">
            <tr>
              <th>Логин</th>
              <th>Имя</th>
              <th>Адрес</th>
              <th>Контракт</th>
            </tr>
          </thead>
          <tbody>
            {data.contracts.map((contract, index) => (
              <tr key={index}>
                <td>{contract.login}</td>
                <td>{contract.name}</td>
                <td>{contract.address}</td>
                <td>{contract.contract}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Phones */}
        <div className="app-container">
          <h2 className="title">Телефоны, привязанные к адресу</h2>
          <div className="container my-4">
            <div className="row">
              {data.phones.map((phone, index) => (
                <div key={index} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">
                        {phone.name || "Неизвестное имя"}
                      </h5>
                    </div>
                    <div className="card-body">
                      <p>
                        <strong>Телефон:</strong> {phone.phone}
                      </p>
                      <h6>Договоры:</h6>
                      <ul className="list-group list-group-flush">
                        {phone.contracts.map((contract, idx) => (
                          <li key={idx} className="list-group-item">
                            <strong>Логин:</strong> {contract.login} <br />
                            <strong>Адрес:</strong> {contract.address} <br />
                            <strong>Договор:</strong> {contract.contract}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App_page;
