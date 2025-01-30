import { toast } from "react-toastify";
import { LogData } from "../../../API/Log";
import { GetTV } from "../../../API/TV";
import setLoadingButton from "./TV";

interface UpdateSettingsRequest {
  login: string;
  operator: string;
  not_turnoff_if_not_used: boolean;
  ban_on_app: boolean;
}

interface UpdateSettingsResponse {
  success: boolean;
  message?: string;
}

export const updateSettings = async (
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

export const handleMakePrimary = async (
  phone: string,
  login: string,
  setData: React.Dispatch<React.SetStateAction<any>>,
  setLoadingButton: (buttonId: string | null) => void
) => {
  setLoadingButton(`make-primary-${phone}`);
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

    const result = await GetTV(login);
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
  } finally {
    setLoadingButton(null);
  }
};

export const handleChangeButton = async (
  operator: string,
  login: string,
  setchangeIsLoading: React.Dispatch<React.SetStateAction<any>>,
  setData: React.Dispatch<React.SetStateAction<any>>
) => {
  setchangeIsLoading(true);

  try {
    const requestData = {
      login,
      operator,
    };

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

export const changeRegion = async (
  phone: string,
  login: string,
  setData: React.Dispatch<React.SetStateAction<any>>,
  setLoadingButton: (buttonId: string | null) => void
) => {
  setLoadingButton(`make-primary-${phone}`);
  const changeOperator = true;

  try {
    const requestData = {
      login,
      phone,
      changeOperator,
    };

    const url = "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/main24phone";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    // Логирование успешного выполнения
    await LogData({
      login,
      page: `TV(${phone})`,
      action: "Изменение региона",
      success: true,
      url: url,
      payload: requestData,
      message: response.statusText,
    });

    toast.success("Регион успешно изменен!", {
      position: "bottom-right",
    });

    const result = await GetTV(login);
    setData(result);
  } catch (error) {
    // Логирование исключения
    await LogData({
      login,
      page: `TV(${phone})`,
      action: "Изменение региона",
      success: false,
      url: "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/main24phone",
      payload: { login, phone, changeOperator },
      message: `Ошибка: ${String(error)}`,
    });

    toast.error(`Ошибка: ${error || "Не удалось обновить настройки"}`, {
      position: "bottom-right",
    });
  } finally {
    setLoadingButton(null);
  }
};
