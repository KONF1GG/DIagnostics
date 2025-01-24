import { useEffect, useState } from "react";
import { useDataContext } from "../../../DataContext/AppContext";
import { GetApp, LoginsData, RBTPhone, RedisLogin } from "../../../API/App";
import { getQueryParams } from "../Default/getData";
import InfoList from "../InfoList";
import "../../CSS/App.css";
import PhoneModal from "./phonesModal";
import {
  handleContractDeleteButton,
  handleUserDelete,
  ChangeRole,
  Relocate,
} from "./requests";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import ClearIcon from "@mui/icons-material/Clear";
import EditLocationIcon from "@mui/icons-material/EditLocation";
import ConfirmationModal from "./../../Modals/ConfirmationModal";
import Loader from "../Default/Loading";

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
  const [modalAddAddresses, setModalAddAddresses] = useState<
    RedisLogin[] | undefined
  >([]);
  const [modalDeletePhone, setDeletePhone] = useState<RBTPhone | null>(null);
  const [modalDeleteContract, setDeleteContract] = useState<RedisLogin | null>(
    null
  );
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
    login: string,
    phones: string[],
    UUID2: string,
    flat: string,
    address_house_id: number
  ) => {
    Relocate(phones.map(Number), UUID2, flat, address_house_id, login, setData);
    setShowModal(false);
  };

  const handleDeleteContract = (contract: LoginsData) => {
    setOnConfirmAction(() => {
      return () => {
        handleContractDeleteButton(contract.UUID2, contract.login, setData); // Логика удаления
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

  const handleDeleteAddress = (
    contract: RedisLogin | undefined,
    phone: RBTPhone | undefined,
    houseId: number,
    flatId: number,
    login: string
  ) => {
    const matchingContracts = phone?.contracts.filter(
      (contract) =>
        contract.contract !== data?.main_contract && contract.flat_id === flatId
    );

    setModalAddAddresses(matchingContracts);
    setDeletePhone(phone || null);
    setDeleteContract(contract || null);
    setOnConfirmAction(() => {
      return () => {
        handleUserDelete(houseId, flatId, login, "адрес", setData);
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
          <div>
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
            <h2 style={{ color: "#02458d" }}>{data.address_in_app}</h2>
          </div>
          {/* Contracts */}
          <h2 className="title">Договоры на адресе</h2>
          <table className="table">
            <thead className="table-primary">
              <tr>
                {["Логин", "Имя", "Адрес", "Договор "].map((header, index) => (
                  <th key={index} className="text-center align-middle">
                    {header}
                  </th>
                ))}
                <th className="text-center align-middle"></th>
              </tr>
            </thead>
            <tbody>
              {data.contracts.map((contract) => (
                <tr key={contract.UUID2} className="align-middle">
                  {["login", "name", "address", "contract"].map((field) => (
                    <td key={field} className="text-center align-middle">
                      {field === "login"
                        ? contract.login
                        : field === "name"
                        ? contract.name
                        : field === "address"
                        ? contract.address
                        : contract.contract}
                    </td>
                  ))}
                  <td className="text-center">
                    <div
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      {contract.relocate && contract.relocate !== "None" && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleRelocate(contract)}
                          title="Переселить"
                          style={{ width: "50px", height: "50px" }}
                        >
                          <EditLocationIcon />
                        </button>
                      )}
                      {contract.active && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteContract(contract)}
                          title="Отвязать"
                          style={{ width: "50px", height: "50px" }}
                        >
                          <PersonRemoveIcon />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Phones */}
          <div className="app-container">
            <h2 className="title">Телефоны, привязанные к адресу</h2>
            {data.phones && data.phones.length > 0 ? (
              <div className="container my-4">
                <div className="row">
                  {data.phones
                    .sort((a, b) => a.role - b.role) // Сортировка: владельцы (role === 0) первыми
                    .map((phone, index) => (
                      <div key={index} className="col-md-6 col-lg-4 mb-4 ">
                        <div className={`card h-100 bg-light`}>
                          <div
                            className={`card-header ${
                              phone.role === 0 ? "highlight-owner" : ""
                            }`}
                          >
                            <div className="dropdown">
                              <button
                                className="btn dropdown-toggle d-flex justify-content-center align-items-center"
                                type="button"
                                id="dropdownMenuButton"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                title="Действия"
                                style={{ border: "none" }}
                              >
                                <div className="text-center w-100">
                                  <strong>
                                    {phone.role === 0
                                      ? "Владелец"
                                      : "Пользователь"}
                                  </strong>
                                  <h5 className="fw-bold mb-0">
                                    {phone.name
                                      ? phone.name
                                      : "Неизвестное имя"}{" "}
                                    {phone.phone}
                                  </h5>
                                </div>
                              </button>
                              <ul
                                className="dropdown-menu dropdown-menu-end"
                                aria-labelledby="dropdownMenuButton"
                              >
                                <li>
                                  <a
                                    className="dropdown-item"
                                    href="#"
                                    onClick={() =>
                                      handleRoleChange(
                                        phone.house_id,
                                        phone.flat_id,
                                        phone.role
                                      )
                                    }
                                  >
                                    {`Сделать ${
                                      phone.role === 0
                                        ? "Пользователем"
                                        : "Владельцем"
                                    }`}
                                  </a>
                                </li>
                                {phone.role !== 0 && (
                                  <li>
                                    <a
                                      className="dropdown-item"
                                      href="#"
                                      onClick={() => {
                                        handleDeleteAddress(
                                          undefined,
                                          phone,
                                          phone.house_id,
                                          phone.flat_id,
                                          queriedLogin
                                        );
                                      }}
                                    >
                                      Отвязать от адреса
                                    </a>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                          <h5 className="fw-bold mb-0 text-center mt-3">
                            {phone.contracts.some(
                              (contract) =>
                                contract.contract !== data.main_contract
                            )
                              ? "Другие адреса, привязанные к этому телефону:"
                              : "Других привязанных адресов к этому телефону нет"}
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
                              {phone.contracts.map(
                                (contract, idx) =>
                                  contract.contract !== data.main_contract && (
                                    <div
                                      key={idx}
                                      className="contract-card border rounded p-3"
                                      style={{
                                        position: "relative",
                                        backgroundColor: "#DCDCDC",
                                        boxShadow:
                                          "0 2px 4px rgba(0, 0, 0, 0.1)",
                                        padding: "1rem", // Добавляем отступы внутри карточки
                                      }}
                                    >
                                      <div>
                                        <div>
                                          <strong>Логин:</strong>{" "}
                                          {contract.login}
                                        </div>
                                        <div>
                                          <strong>Адрес:</strong>{" "}
                                          {contract.address}
                                        </div>
                                        <div>
                                          <strong>Договор:</strong>{" "}
                                          {contract.contract}
                                        </div>
                                      </div>
                                      {(contract.flat_id !== data.flat_id ||
                                        phone.role === 1) && (
                                        <button
                                          className="btn"
                                          onClick={() => {
                                            handleDeleteAddress(
                                              contract,
                                              undefined,
                                              contract.house_id,
                                              contract.flat_id,
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
                                      )}
                                    </div>
                                  )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <strong>Данных нет</strong>
            )}
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
        login={queriedLogin}
        show={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        addContracts={modalAddAddresses}
        phone={modalDeletePhone}
        contract={modalDeleteContract}
        onConfirm={onConfirmAction}
      />
    </div>
  );
};

export default App_page;
