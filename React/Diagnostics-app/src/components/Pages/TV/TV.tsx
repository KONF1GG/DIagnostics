import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDataContext } from "../../../DataContext/TVContext";
import { GetTV } from "../../../API/TV";
import "../../CSS/Loading.css";
import "../../CSS/TV.css";
import ServiceTable from "./ServiceTable";
import UserInfo from "./UserInfoProps";
import InfoList from "../InfoList";
import Checkbox from "./CheckBox";

const updateSettings = async (
  login: string,
  operator: string,
  not_turnoff_if_not_used: boolean,
  ban_on_app: boolean
) => {
  const requestData = {
    login,
    operator,
    not_turnoff_if_not_used,
    ban_on_app,
  };

  console.log(requestData)
  try {
    await fetch("http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/settingsTV", {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
  } catch (error) {
    console.error("Ошибка при отправке данных на сервер:", error);
  }
};

const TV = () => {
  const location = useLocation();
  const { data, setData, login, setLogin } = useDataContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Функция для получения параметра "login" из URL
  const getQueryParams = () => {
    const params = new URLSearchParams(location.search);
    return params.get("login") || "";
  };

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
    checkbox: string,
    value: boolean
  ) => {
    const updatedState = {
      ...smotreshkaCheckboxes,
      [checkbox]: value,
    };

    setSmotreshkaCheckboxes(updatedState);

    try {
      await updateSettings(
        queriedLogin,
        "Смотрешка",
        updatedState.notTurnOffIfNotUsed,
        updatedState.banOnApp
      );

      const result = await GetTV(queriedLogin);
      setData(result);

    } catch (error) {
      console.error("Ошибка при обновлении настроек:", error);
    }
  };

  const handleTv24CheckboxChange = async (value: boolean) => {
    setTv24Checkbox({ banOnApp: value });

    try {
      await updateSettings(queriedLogin, "24ТВ", false, value);
      const result = await GetTV(queriedLogin);
      setData(result);
    } catch (error) {
      console.error("Ошибка при обновлении настроек:", error);
    }
  };

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

  if (data?.errors._1c) {
    return (
      <div>
        <InfoList />
        <p className="no-services-message fade-in">Услуги отсутствуют</p>
      </div>
    );
  }

  return (
    <div>
      <InfoList />
      <div className={`container fade-in ${isVisible ? "visible" : ""}`}>
        {data?.smotreshka?.login && (
          <>
            <h2 className="title">Смотрешка</h2>
            <div className="d-flex align-items-center">
              <div className="me-3">
                <UserInfo
                  login={data.smotreshka.login}
                  password={data.smotreshka.password}
                />
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-6">
                <ServiceTable
                  title="1С"
                  services={data.smotreshka.service1c}
                  emptyMessage="Нет данных"
                />
              </div>
              <div className="col-md-6">
                <ServiceTable
                  title="Смотрешка"
                  services={data.smotreshka.serviceOp}
                  emptyMessage="Нет данных"
                />
              </div>
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
                    handleSmotreshkaCheckboxChange("banOnApp", e.target.checked)
                  }
                />
              </div>
            </div>
          </>
        )}

        {data?.tvip?.login && (
          <>
            <h2 className="title mt-5">ТВИП</h2>
            <div className="d-flex align-items-center">
              <UserInfo login={data.tvip.login} password={data.tvip.password} />
            </div>
            <div className="row mt-3">
              <div className="col-md-6">
                <ServiceTable
                  title="1С"
                  services={data.tvip.service1c}
                  emptyMessage="Нет данных"
                />
              </div>
              <div className="col-md-6">
                <ServiceTable
                  title="ТВИП"
                  services={data.tvip.serviceOp}
                  emptyMessage="Нет данных"
                />
              </div>
            </div>
          </>
        )}

        {data?.tv24?.phone && (
          <>
            <h2 className="title mt-5">24ТВ</h2>
            <p className="text-start fs-4">
              <strong>Номер:</strong> {data.tv24.phone || "Не указан"}
            </p>
            <div className="row mt-3">
              <div className="col-md-6">
                <ServiceTable
                  title="1С"
                  services={data.tv24.service1c}
                  emptyMessage="Нет данных"
                />
              </div>
              <div className="col-md-6">
                <ServiceTable
                  title="24ТВ"
                  services={data.tv24.serviceOp}
                  emptyMessage="Нет данных"
                />
              </div>
              <Checkbox
                id="banOnAppCheckbox-tv24"
                label="Запретить включать пакеты из приложения"
                checked={tv24Checkbox.banOnApp}
                disabled={data.tv24.ban_on_app === undefined}
                onChange={(e) => handleTv24CheckboxChange(e.target.checked)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TV;
