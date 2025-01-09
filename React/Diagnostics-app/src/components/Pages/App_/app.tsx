import { useEffect, useState } from "react";
import { useDataContext } from "../../../DataContext/AppContext";
import { GetApp } from "../../../API/App";
import { getQueryParams } from "../Default/getData";
import InfoList from "../InfoList";
import "../../CSS/App.css";
import PhoneModal from "./phonesModal";
import { handleContractDeleteButton } from "./requests";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import EditIcon from "@mui/icons-material/Edit";
import ClearIcon from "@mui/icons-material/Clear";

const App_page = () => {
  const { data, setData, login, setLogin } = useDataContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Модальное окно
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const queriedLogin = getQueryParams();

  // Функция загрузки данных
  const fetchData = async (login) => {
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

  const handleRelocate = (contract) => {
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
            Договор не зарегистрирован в приложении
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
                {data.phones
                  .sort((a, b) => a.role - b.role) // Сортировка: владельцы (role === 0) первыми
                  .map((phone, index) => (
                    <div key={index} className="col-md-6 col-lg-4 mb-4">
                      <div className={`card h-100 bg-light`}>
                        <div
                          className={`card-header d-flex justify-content-between align-items-center`}
                        >
                          <h5
                            className={`card-title ${
                              phone.role === 0 ? "owner" : ""
                            }`}
                          >
                            {phone.role === 0 ? "Владелец" : "Пользователь"}
                          </h5>
                          <div>
                            <button
                              className="btn btn-link"
                              onClick={() => setShowModal(true)}
                              title="Изменить роль"
                            >
                              <EditIcon />
                            </button>
                            {phone.role !== 0 && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  // Логика для отвязывания телефона
                                }}
                                title="Отвязать"
                              >
                                <PersonRemoveIcon fontSize="small"/>
                              </button>
                            )}
                          </div>
                        </div>
                        <h5 className="mb-0 text-center">
                          {phone.phone}{" "}
                          {phone.name ? phone.name : "Неизвестное имя"}
                        </h5>
                        <div className="card-body">
                          <ul className="list-group list-group-flush p-0">
                            {phone.contracts.map((contract, idx) => (
                              <li
                                key={idx}
                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                              >
                                <div>
                                  <strong>Логин:</strong> {contract.login}{" "}
                                  <br />
                                  <strong>Адрес:</strong> {contract.address}{" "}
                                  <br />
                                  <strong>Договор:</strong> {contract.contract}
                                </div>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    /* Логика для отвязывания адреса */
                                  }}
                                  title="Отвязать"
                                >
                                  <ClearIcon />
                                </button>
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
