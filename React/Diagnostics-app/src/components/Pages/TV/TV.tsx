import { useEffect, useState } from "react";
import { useDataContext } from "../../../DataContext/TVContext";
import { GetTV } from "../../../API/TV";
import "../../CSS/Loading.css";
import "../../CSS/TV.css";
import ServiceTable from "./ServiceTable";
import UserInfo from "./UserInfoProps";
import InfoList from "../InfoList";
import Checkbox from "./CheckBox";
import { getQueryParams } from "../Default/getData";
import { toast } from "react-toastify";
import { LogData } from "../../../API/Log";
import Loader from "../Default/Loading";
import {
  changeRegion,
  handleChangeButton,
  handleMakePrimary,
  updateSettings,
} from "./requests";

interface CheckboxState {
  notTurnOffIfNotUsed: boolean;
  banOnApp: boolean;
}

interface CorrecrtTVData {
  login: string;
  operator: string;
}

// const showError = (message: string) => {
//   alert(message);
// };

const TV = () => {
  const { data, setData, login, setLogin } = useDataContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [ischangeLoading, setchangeIsLoading] = useState(false);
  const [loadingButton, setLoadingButton] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const queriedLogin = getQueryParams();

  const [smotreshkaCheckboxes, setSmotreshkaCheckboxes] = useState({
    notTurnOffIfNotUsed: data?.smotreshka?.not_turnoff_if_not_used || false,
    banOnApp: data?.smotreshka?.ban_on_app || false,
  });

  const [tv24Checkbox, setTv24Checkbox] = useState({
    banOnApp: data?.tv24?.ban_on_app || false,
  });

  useEffect(() => {
    setSmotreshkaCheckboxes({
      notTurnOffIfNotUsed: data?.smotreshka?.not_turnoff_if_not_used || false,
      banOnApp: data?.smotreshka?.ban_on_app || false,
    });

    setTv24Checkbox({
      banOnApp: data?.tv24?.ban_on_app || false,
    });
  }, [data]);

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

  // Функция загрузки данных
  const fetchData = async (login: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await GetTV(login);
      setData(result);
    } catch {
      setError("Ошибка загрузки данных");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSmotreshkaCheckboxChange = async (
    checkbox: keyof CheckboxState,
    value: boolean
  ) => {
    const previousState = { ...smotreshkaCheckboxes }; // Сохранение текущего состояния

    const updatedState: CheckboxState = {
      ...smotreshkaCheckboxes,
      [checkbox]: value,
    };

    setSmotreshkaCheckboxes(updatedState);

    try {
      const result = await updateSettings(
        queriedLogin,
        "Смотрешка",
        updatedState.notTurnOffIfNotUsed,
        updatedState.banOnApp
      );

      if (!result.success) {
        setSmotreshkaCheckboxes(previousState); // Откат состояния при ошибке
        toast.error(
          `Ошибка: ${result.message || "Не удалось обновить настройки"}`,
          {
            position: "bottom-right",
          }
        );
      } else {
        toast.success("Настройки успешно обновлены!", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      setSmotreshkaCheckboxes(previousState); // Откат состояния при исключении
      toast.error("Ошибка: Не удалось обновить настройки", {
        position: "bottom-right",
      });
    }
  };

  const handleTv24CheckboxChange = async (value: boolean) => {
    const previousState = { ...tv24Checkbox };

    setTv24Checkbox({ banOnApp: value });

    try {
      const result = await updateSettings(queriedLogin, "24ТВ", false, value);

      if (!result.success) {
        setTv24Checkbox(previousState); // Откат состояния при ошибке
        toast.error(
          `Ошибка: ${result.message || "Не удалось обновить настройки"}`,
          {
            position: "bottom-right",
          }
        );
      } else {
        toast.success("Настройки успешно обновлены!", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      setTv24Checkbox(previousState); // Откат состояния при исключении
      console.error("Ошибка при обновлении настроек:", error);
      toast.error("Ошибка: Не удалось обновить настройки", {
        position: "bottom-right",
      });
    }
  };

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

  if (data?.errors._1c) {
    return (
      <div>
        <InfoList>
          <p className="no-services-message fade-in">Услуги отсутствуют</p>
        </InfoList>
      </div>
    );
  }
  return (
    <div>
      <InfoList>
        <div className={`container fade-in ${isVisible ? "visible" : ""}`}>
          {data?.smotreshka?.login && (
            <>
              <h2
                className={
                  data.smotreshka.error
                    ? "title-red text-danger fade-in"
                    : "title fade-in"
                }
              >
                Смотрешка
              </h2>
              <div className="d-flex align-items-center justify-content-between">
                <div className="me-3">
                  <UserInfo
                    login={data.smotreshka.login}
                    password={data.smotreshka.password}
                  />
                </div>
                {data.smotreshka.error &&
                  data.smotreshka.error.includes("Данные не совпадают") && (
                    <div className="ms-auto">
                      <button
                        className={`btn ${
                          ischangeLoading ? "btn-secondary" : "btn-danger"
                        } ${!ischangeLoading ? "btn-danger-hover" : ""}`}
                        onClick={() =>
                          !ischangeLoading &&
                          handleChangeButton(
                            "Смотрешка",
                            queriedLogin,
                            setchangeIsLoading,
                            setData
                          )
                        }
                        disabled={ischangeLoading}
                      >
                        {ischangeLoading ? (
                          <div
                            className="spinner-border spinner-border-sm"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          "Исправить"
                        )}
                      </button>
                    </div>
                  )}
              </div>
              <div className="row mt-3">
                <div className="col-md-6">
                  <ServiceTable
                    title="1С"
                    services={data.smotreshka.service1c}
                    emptyMessage="Нет данных"
                    highlight={data.smotreshka.error ? true : false}
                  />
                </div>
                <div className="col-md-6">
                  <ServiceTable
                    title="Смотрешка"
                    services={data.smotreshka.serviceOp}
                    emptyMessage="Нет данных"
                    highlight={data.smotreshka.error ? true : false}
                  />
                </div>
                <div className="d-flex flex-column">
                  <div className="d-flex align-items-start justify-content-between">
                    <div className="d-flex flex-column align-items-start">
                      <Checkbox
                        id="NotTurnOffIfNotUsed-smotreshka"
                        label="Не отключать при неиспользовании"
                        checked={smotreshkaCheckboxes.notTurnOffIfNotUsed}
                        disabled={
                          data.smotreshka.not_turnoff_if_not_used === undefined
                        }
                        className="checkbox-item"
                        onChange={(e) =>
                          handleSmotreshkaCheckboxChange(
                            "notTurnOffIfNotUsed",
                            e.target.checked
                          )
                        }
                      />
                      <Checkbox
                        id="BanOnApp-smotreshka"
                        label="Запретить включать пакеты из приложения"
                        checked={smotreshkaCheckboxes.banOnApp}
                        disabled={data.smotreshka.ban_on_app === undefined}
                        className="checkbox-item"
                        onChange={(e) =>
                          handleSmotreshkaCheckboxChange(
                            "banOnApp",
                            e.target.checked
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {data?.tvip?.login && (
            <>
              <h2
                className={data.tvip.error ? "title-red text-danger" : "title"}
              >
                ТВИП
              </h2>
              <div className="d-flex align-items-center justify-content-between">
                <div className="">
                  <UserInfo
                    login={data.tvip.login}
                    password={data.tvip.password}
                  />
                </div>
                {data.tvip.error && (
                  <div className="ms-auto">
                    <button
                      className={`btn ${
                        ischangeLoading ? "btn-secondary" : "btn-danger"
                      } ${!ischangeLoading ? "btn-danger-hover" : ""}`}
                      onClick={() =>
                        !ischangeLoading &&
                        handleChangeButton(
                          "ТВИП",
                          queriedLogin,
                          setchangeIsLoading,
                          setData
                        )
                      }
                      disabled={ischangeLoading}
                    >
                      {ischangeLoading ? (
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        "Исправить"
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="row mt-3">
                <div className="col-md-6">
                  <ServiceTable
                    title="1С"
                    services={data.tvip.service1c}
                    emptyMessage="Нет данных"
                    highlight={data.tvip.error ? true : false}
                  />
                </div>
                <div className="col-md-6">
                  <ServiceTable
                    title="ТВИП"
                    services={data.tvip.serviceOp}
                    emptyMessage="Нет данных"
                    highlight={data.tvip.error ? true : false}
                  />
                </div>
              </div>
            </>
          )}

          {data?.tv24?.phone?.phone && (
            <div className="">
              <h2
                className={data.tv24.error ? "title-red text-danger" : "title"}
              >
                24ТВ
              </h2>
              <div className="d-flex align-items-center justify-content-between">
                <div className="me-3">
                  <p className="text-start text-mobile-big">
                    <strong>Номер:</strong>{" "}
                    {data.tv24.phone.phone || "Не указан"}{" "}
                    <strong>Регион:</strong>{" "}
                    {data.tv24.phone.operator == "24ТВ"
                      ? "Урал"
                      : data.tv24.phone.operator == "24ТВ КРД"
                      ? "Краснодар"
                      : "Неизвестно"}
                  </p>
                </div>
                {data.tv24.error && (
                  <div className="ms-auto">
                    <button
                      className={`btn ${
                        ischangeLoading ? "btn-secondary" : "btn-danger"
                      } ${!ischangeLoading ? "btn-danger-hover" : ""}`}
                      onClick={() =>
                        data.tv24.isKRD
                          ? handleChangeButton(
                              "24ТВ КРД",
                              queriedLogin,
                              setchangeIsLoading,
                              setData
                            )
                          : handleChangeButton(
                              "24ТВ",
                              queriedLogin,
                              setchangeIsLoading,
                              setData
                            )
                      }
                      disabled={ischangeLoading}
                    >
                      {ischangeLoading ? (
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        "Исправить"
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="row mt-3">
                <div className="col-md-6">
                  <ServiceTable
                    title="1С"
                    services={data.tv24.service1c}
                    emptyMessage="Нет данных"
                    highlight={data.tv24.error ? true : false}
                  />
                </div>
                <div className="col-md-6">
                  <ServiceTable
                    title="24ТВ"
                    services={data.tv24.serviceOp}
                    emptyMessage="Нет данных"
                    highlight={data.tv24.error ? true : false}
                  />
                </div>
                <div>
                  <Checkbox
                    id="banOnAppCheckbox-tvip"
                    label="Запретить включать пакеты из приложения"
                    checked={tv24Checkbox.banOnApp}
                    disabled={data.tv24.ban_on_app === undefined}
                    onChange={(e) => handleTv24CheckboxChange(e.target.checked)}
                  />
                </div>
              </div>
              <div className="phone-list">
                {data?.tv24?.phone?.phone && (
                  <div
                    key={data.tv24.phone.phone}
                    className="phone-card primary-card"
                  >
                    <span className="phone-label text-primary fs-5">
                      Основной номер
                    </span>
                    <div className="d-flex flex-column phone-info">
                      <span className="phone-number">
                        {data.tv24.phone.phone}
                      </span>
                      <span className="phone-number">
                        Регион:{" "}
                        {data.tv24.phone.operator === "24ТВ КРД"
                          ? "Краснодар"
                          : "Урал"}
                      </span>
                    </div>
                    <div className="button-container row g-2">
                      <button
                        onClick={() => {
                          if (data?.tv24?.phone?.phone) {
                            changeRegion(
                              data.tv24.phone.phone,
                              queriedLogin,
                              setData,
                              setLoadingButton
                            );
                          }
                        }}
                        className="btn btn-primary make-primary-btn"
                        disabled={loadingButton !== null}
                      >
                        {loadingButton ===
                        `change-region-${data?.tv24?.phone?.phone}` ? (
                          <div
                            className="spinner-border spinner-border-sm"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          "Изменить регион"
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {data?.tv24?.additional_phones?.map((phone) => (
                  <div key={phone.phone} className="phone-card">
                    <div className="d-flex flex-column phone-info">
                      <span className="phone-number">{phone.phone}</span>
                      <span className="phone-number">
                        Регион:{" "}
                        {phone.operator === "24ТВ КРД" ? "Краснодар" : "Урал"}
                      </span>
                    </div>
                    <div className="button-container row g-2">
                      <button
                        onClick={() =>
                          handleMakePrimary(
                            phone.phone,
                            queriedLogin,
                            setData,
                            setLoadingButton
                          )
                        }
                        disabled={loadingButton !== null}
                        className="btn btn-primary make-primary-btn"
                      >
                        {loadingButton === `make-primary-${phone.phone}` ? (
                          <div
                            className="spinner-border spinner-border-sm"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          "Сделать основным"
                        )}
                      </button>
                      <button
                        onClick={() =>
                          changeRegion(
                            phone.phone,
                            queriedLogin,
                            setData,
                            setLoadingButton
                          )
                        }
                        className="btn btn-primary make-primary-btn"
                        disabled={loadingButton !== null}
                      >
                        {loadingButton === `change-region-${phone.phone}` ? (
                          <div
                            className="spinner-border spinner-border-sm"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          "Изменить регион"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </InfoList>
    </div>
  );
};

export default TV;
