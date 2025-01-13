import { useEffect, useState } from "react";
import { useDataContext } from "../../../DataContext/AppContext";
import { GetApp } from "../../../API/App";
import { getQueryParams } from "../Default/getData";
import InfoList from "../InfoList";
import "../../CSS/App.css";
import PhoneModal from "./phonesModal";
import {
  handleContractDeleteButton,
  handleUserDelete,
  ChangeRole,
} from "./requests";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import ClearIcon from "@mui/icons-material/Clear";
import EditLocationIcon from "@mui/icons-material/EditLocation";
import ConfirmationModal from "./../../Modals/ConfirmationModal";

const App_page = () => {
  const { data, setData, login, setLogin } = useDataContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Модальное окно для переселения
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Модальное окно для подтверждения
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => {});

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
    setShowModal(true); // Открытие модалки для переселения
  };

  const confirmRelocation = (
    selectedNumbers: number[],
    selectedNames: string[]
  ) => {
    console.log(selectedNumbers);
    // Логика переселения через API или обновление данных
    setShowModal(false); // Закрытие модалки переселения
  };

  const handleDeleteContract = (UUID2: string, login: string) => {
    setModalTitle("Удаление договора");
    setModalMessage("Вы уверены, что хотите отвязать этот договор?");
    setOnConfirmAction(() => {
      return () => {
        console.log("Функция удаления активирована");
        console.log("Удалён контракт:", UUID2);
        handleContractDeleteButton(UUID2, login, setData); // Логика удаления
        setShowConfirmModal(false);
      };
    });
    setShowConfirmModal(true);
  };

  const handleRoleChange = async (
    houseId: number,
    flatId: number,
    currentRole: number
  ) => {
    const newRole = currentRole === 0 ? 1 : 0;
    try {
      // Здесь вызывается API для смены роли (пример)
      await ChangeRole(houseId, flatId, newRole, queriedLogin, setData);
      console.log(
        `Роль изменена на ${newRole === 0 ? "Владелец" : "Пользователь"}`
      );
    } catch (error) {
      console.error("Ошибка при смене роли:", error);
    }
  };

  const handleDeleteNumber = (houseId: number, login: string) => {
    setModalTitle("Удаление номера");
    setModalMessage("Вы уверены, что хотите отвязать этот номер?");
    setOnConfirmAction(() => {
      return () => {
        handleUserDelete(houseId, login, "номер", setData);
        setShowConfirmModal(false); // Закрытие модалки
      };
    });
    setShowConfirmModal(true); // Открытие модалки подтверждения
  };

  const handleDeleteAddress = (houseId: number, login: string) => {
    setModalTitle("Удаление адреса");
    setModalMessage("Вы уверены, что хотите отвязать этот адрес?");
    setOnConfirmAction(() => {
      return () => {
        handleUserDelete(houseId, login, "адрес", setData);
        setShowConfirmModal(false); // Закрытие модалки
      };
    });
    setShowConfirmModal(true); // Открытие модалки подтверждения
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

                  <td className="d-flex" style={{ border: "none" }}>
                    {contract.relocate && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleRelocate(contract)}
                        title="Переселить"
                      >
                        <EditLocationIcon />
                      </button>
                    )}
                    {contract.active && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleDeleteContract(contract.UUID2, contract.login)
                        }
                        title="Отвязать"
                      >
                        <PersonRemoveIcon />
                      </button>
                    )}
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
                    <div key={index} className="col-md-6 col-lg-4 mb-4 ">
                      <div className={`card h-100 bg-light`}>
                        <div
                          className={`card-header d-flex justify-content-between align-items-center ${
                            phone.role === 0 ? "highlight-owner" : ""
                          }`}
                        >
                          <h5
                            className={`card-title ${
                              phone.role === 0 ? "owner fw-bold" : ""
                            }`}
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              handleRoleChange(
                                phone.house_id,
                                phone.flat_id,
                                phone.role
                              )
                            }
                            title="Нажмите, чтобы изменить роль"
                          >
                            {phone.role === 0 ? "Владелец" : "Пользователь"}
                          </h5>
                          <div className="d-flex align-items-center">
                            {phone.role !== 0 && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  handleDeleteNumber(
                                    phone.house_id,
                                    queriedLogin
                                  );
                                }}
                                title="Отвязать"
                              >
                                <PersonRemoveIcon fontSize="small" />
                              </button>
                            )}
                          </div>
                        </div>
                        <h5 className="fw-bold mb-0 text-center mt-3">
                          {phone.name ? phone.name : "Неизвестное имя"}{" "}
                          {phone.phone}
                        </h5>
                        <div className="card-body">
                          <div
                            className="contract-grid"
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(250px, 1fr))",
                              gap: "1rem",
                            }}
                          >
                            {phone.contracts.map((contract, idx) => (
                              <div
                                key={idx}
                                className="contract-card border rounded p-3"
                                style={{
                                  position: "relative",
                                  backgroundColor: "#DCDCDC",
                                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                }}
                              >
                                <div>
                                  <div>
                                    <strong>Логин:</strong> {contract.login}
                                  </div>
                                  <div>
                                    <strong>Адрес:</strong> {contract.address}
                                  </div>
                                  <div>
                                    <strong>Договор:</strong>{" "}
                                    {contract.contract}
                                  </div>
                                </div>
                                <button
                                  className="btn"
                                  onClick={() => {
                                    handleDeleteAddress(
                                      contract.house_id,
                                      queriedLogin
                                    );
                                  }}
                                  title="Отвязать"
                                  style={{
                                    position: "absolute",
                                    top: "0.5rem",
                                    right: "0.5rem",
                                    padding: "0.25rem",
                                    fontSize: "1rem",
                                    width: "auto",
                                  }}
                                >
                                  <ClearIcon fontSize="small" />
                                </button>
                              </div>
                            ))}
                          </div>
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

      {/* Подключение ConfirmationModal */}
      <ConfirmationModal
        show={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        title={modalTitle}
        message={modalMessage}
        onConfirm={onConfirmAction}
      />
    </div>
  );
};

export default App_page;
