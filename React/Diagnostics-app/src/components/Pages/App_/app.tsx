import { useEffect, useState } from "react";
import { useDataContext } from "../../../DataContext/AppContext";
import { GetApp } from "../../../API/App";
import { getQueryParams } from "../Default/getData";
import InfoList from "../InfoList";
import "../../CSS/App.css";
import PhoneModal from "./phonesModal";
import { handleContractDeleteButton } from "./requests";

const App_page = () => {
  const { data, setData, login, setLogin } = useDataContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Модальное окно
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

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

  const handleRelocate = (contract: any) => {
    setSelectedContract(contract);
    setShowModal(true);
  };

  const confirmRelocation = () => {
    console.log("Переселён контракт:", selectedContract);
    // Логика переселения через API или обновление данных
    setShowModal(false);
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
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Загрузка...</p>
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

  console.log(data);
  if (!data) {
    return (
      <div>
        <InfoList>
          <p className="no-services-message fade-in">
            Договор не зарегестрирван в приложении
          </p>
        </InfoList>
      </div>
    );
  }

  return (
    <div>
      <InfoList>
        <div className={`container fade-in ${isVisible ? "visible" : ""}`}>
          <div className="border border-primary text-center p-3 rounded mb-4">
            <h2 className="text-primary">{data.address_in_app}</h2>
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
                {data.contracts.some((contract) => !contract.active) && (
                  <th></th>
                )}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.contracts.map((contract, index) => (
                <tr key={index}>
                  <td>{contract.login}</td>
                  <td>{contract.name}</td>
                  <td>{contract.address}</td>
                  <td>{contract.contract}</td>
                  {!contract.active && (
                    <td className="text-center">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          handleContractDeleteButton(
                            contract.UUID2,
                            contract.login, 
                            setData
                          )
                        }
                      >
                        Отвязать
                      </button>
                    </td>
                  )}
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleRelocate(contract)}
                    >
                      Переселить
                    </button>
                  </td>
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
                        <h5 className="mb-2">
                          {phone.phone}{" "}
                          {phone.name ? `${phone.name}` : "Неизвестное имя"}
                          {phone.role === 0 ? " (Владелец)" : ""}
                        </h5>
                      </div>
                      <div className="card-body">
                        <ul className="list-group list-group-flush p-0">
                          {phone.contracts.map((contract, idx) => (
                            <li
                              key={idx}
                              className="list-group-item list-group-item-action"
                            >
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
      </InfoList>

      {/* Подключение PhoneModal */}
      <PhoneModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmRelocation}
        contract={selectedContract}
        phoneNumbers={data.phones}
      />
    </div>
  );
};

export default App_page;
