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

interface UpdateSettingsRequest {
  login: string;
  operator: string;
  not_turnoff_if_not_used: boolean;
  ban_on_app: boolean;
}

interface CorrecrtTVData {
  login: string;
  operator: string;
}

interface UpdateSettingsResponse {
  success: boolean;
  message?: string;
}

interface CheckboxState {
  notTurnOffIfNotUsed: boolean;
  banOnApp: boolean;
}

const updateSettings = async (
  login: string,
  operator: string,
  not_turnoff_if_not_used: boolean,
  ban_on_app: boolean
): Promise<UpdateSettingsResponse> => {
  const requestData: UpdateSettingsRequest = {
    login,
    operator,
    not_turnoff_if_not_used,
    ban_on_app,
  };

  const url: string =
    "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/settingsTV";

  try {
    console.log("Отправляем запрос с данными:", requestData);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      console.error(
        "Ошибка ответа от сервера:",
        response.status,
        response.statusText
      );

      await LogData({
        login,
        page: `TV(${operator})`,
        action: "Изменение настроек",
        success: false,
        url: url,
        payload: requestData,
        message: `Ошибка сервера: ${response.statusText} (код: ${response.status})`,
      });

      return { success: false, message: "Ошибка сервера" };
    }

    const responseData = (await response.json()) as UpdateSettingsResponse;

    await LogData({
      login,
      page: `TV(${operator})`,
      action: "Изменение настроек",
      success: true,
      url: url,
      payload: requestData,
      message: "Настройки успешно обновлены",
    });

    return { success: true, message: responseData.message };
  } catch (error) {
    await LogData({
      login,
      page: `TV(${operator})`,
      action: "Изменение настроек",
      success: false,
      url: url,
      payload: requestData,
      message: `Ошибка: ${String(error)}`,
    });

    console.error("Ошибка при отправке данных на сервер:", error);
    return { success: false, message: "Ошибка подключения к серверу" };
  }
};

// const showError = (message: string) => {
//   alert(message);
// };

const TV = () => {
  const { data, setData, login, setLogin } = useDataContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [ischangeLoading, setchangeIsLoading] = useState(false);
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
      console.log(result);
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

  const handleChangeButton = async (operator: string, login: string) => {
    console.log(`Кнопка для исправить ${operator} нажата!`);
    setchangeIsLoading(true);

    try {
      const requestData = {
        login,
        operator,
      };

      console.log("Отправляем запрос с данными:", requestData);
      const url = "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/correctTV";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        // Логирование ошибки
        await LogData({
          login,
          page: `TV(${operator})`,
          action: "correctTV",
          success: false,
          url: url,
          payload: requestData,
          message: `Ошибка: ${
            response.statusText || "Не удалось обновить настройки"
          }`,
        });

        toast.error(
          `Ошибка: ${response.statusText || "Не удалось обновить настройки"}`,
          { position: "bottom-right" }
        );
        setchangeIsLoading(false);
        return;
      }

      // Логирование успешного выполнения
      await LogData({
        login,
        page: `TV(${operator})`,
        action: "correctTV",
        success: true,
        url: url,
        payload: requestData,
        message: response.statusText,
      });

      toast.success("Синхронизация статусов запущена", {
        position: "bottom-right",
      });

      setTimeout(() => setchangeIsLoading(false), 5000);
      const result = await GetTV(login);
      setData(result);
    } catch (error) {
      // Логирование исключения
      await LogData({
        login,
        page: `TV(${operator})`,
        action: "correctTV",
        success: false,
        url: "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/correctTV",
        payload: { login, operator },
        message: `Ошибка: ${String(error)}`,
      });

      toast.error(`Ошибка: ${error || "Не удалось обновить настройки"}`, {
        position: "bottom-right",
      });
      setchangeIsLoading(false);
    }
  };

  const handleMakePrimary = async (phone: string, login: string) => {
    console.log(`Кнопка для телефона ${phone} нажата!`);
    try {
      const payload = {
        login: login,
        phone: phone,
      };

      const url = "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/main24phone";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(response);

      if (response.ok) {
        // Логирование успешного действия
        await LogData({
          login,
          page: `TV(24ТВ)`,
          action: "Сделать основным",
          success: true,
          url: url,
          payload: payload,
          message: response.statusText,
        });

        toast.success("Телефон сделан основным", {
          position: "bottom-right",
        });
      } else {
        // Логирование ошибки сервера
        await LogData({
          login,
          page: `TV(24ТВ)`,
          action: "Сделать основным",
          success: false,
          url: url,
          payload: payload,
          message: `Ошибка сервера: ${response.statusText} (код: ${response.status})`,
        });

        toast.error("Ошибка: Не удалось изменить основной номер", {
          position: "bottom-right",
        });
      }

      const result = await GetTV(queriedLogin);
      setData(result);
    } catch (error) {
      // Логирование исключения
      await LogData({
        login,
        page: `TV(24ТВ)`,
        action: "Сделать основным",
        success: false,
        url: "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/main24phone",
        payload: { login, phone },
        message: `Ошибка: ${String(error)}`,
      });

      toast.error("Ошибка: Не удалось изменить основной номер", {
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
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Загрузка...</p>
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
                {data.smotreshka.error && (
                  <div className="ms-auto">
                    <button
                      className={`btn ${
                        ischangeLoading ? "btn-secondary" : "btn-danger"
                      } ${!ischangeLoading ? "btn-danger-hover" : ""}`}
                      onClick={() =>
                        !ischangeLoading &&
                        handleChangeButton("Смотрешка", queriedLogin)
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
                className={
                  data.tvip.error ? "title-red text-danger mt-5" : "title mt-5"
                }
              >
                ТВИП
              </h2>
              <div className="d-flex align-items-center justify-content-between">
                <div className="me-3">
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
                        handleChangeButton("ТВИП", queriedLogin)
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

          {data?.tv24?.phone && (
            <>
              <h2
                className={
                  data.tv24.error ? "title-red text-danger mt-5" : "title mt-5"
                }
              >
                24ТВ
              </h2>
              <div className="d-flex align-items-center justify-content-between">
                <div className="me-3">
                  <p className="text-start fs-4">
                    <strong>Номер:</strong> {data.tv24.phone || "Не указан"}
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
                          ? handleChangeButton("24ТВ КРД", queriedLogin)
                          : handleChangeButton("24ТВ", queriedLogin)
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
                {data?.tv24?.additional_phones?.map((phone) => (
                  <div key={phone} className="phone-card">
                    <div className="phone-info">
                      <span className="phone-number">{phone}</span>
                    </div>
                    <div className="button-container">
                      <button
                        onClick={() => handleMakePrimary(phone, queriedLogin)}
                        className="btn btn-primary make-primary-btn"
                      >
                        Сделать основным
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </InfoList>
    </div>
  );
};

export default TV;
