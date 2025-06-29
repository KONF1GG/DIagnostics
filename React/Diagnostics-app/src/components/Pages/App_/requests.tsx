import { toast } from "react-toastify";
import { LogData } from "../../../API/Log";
import { ApiError, GetApp } from "../../../API/App";
import api from "./../../../API/api";
import { AxiosError } from "axios";

export const handleContractDeleteButton = async (
  uuid2: string,
  login: string,
  setData: React.Dispatch<React.SetStateAction<any>>
) => {
  const requestData = {
    UUID2: uuid2,
    flatId: 0,
  };
  try {
    const url = "http://server1c.freedom1.ru/UNF_CRM_WS/hs/RBT/setFlatId";

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
        page: `Приложение`,
        action: "Кнопка отвзяать (Договор на адресе)",
        success: false,
        url: url,
        payload: requestData,
        message: `Ошибка: ${
          response.statusText || "Не удалось обновить настройки"
        }`,
      });

      toast.error(
        `Ошибка: ${response.statusText || "Не удалось отвязать договор"}`,
        { position: "bottom-right" }
      );
      return;
    }
    // Логирование успешного выполнения
    await LogData({
      login,
      page: `Приложение`,
      action: "Кнопка отвзяать (Договор на адресе)",
      success: true,
      url: url,
      payload: requestData,
      message: response.statusText,
    });

    toast.success("Договор успешно отвязан", {
      position: "bottom-right",
    });

    const result = await GetApp(login);

    if (result && "detail" in result) {
      setData(null);
    } else if (result) {
      setData(result);
    } else {
      setData(null);
    }
    
  } catch (error) {
    // Логирование исключения
    await LogData({
      login,
      page: `Приложение`,
      action: "Кнопка отвзяать (Договор на адресе)",
      success: false,
      url: "http://server1c.freedom1.ru/UNF_CRM_WS/hs/RBT/setFlatId",
      payload: requestData,
      message: `Ошибка: ${String(error)}`,
    });

    toast.error(`Ошибка: ${error || "Не удалось отвязать договор"}`, {
      position: "bottom-right",
    });
  }
};

export const handleUserDelete = async (
  house_id: number,
  flat_id: number,
  login: string,
  deleteObject: string,
  setData: React.Dispatch<React.SetStateAction<any>>
) => {
  const url = `/v1/app/houses_flats_subscribers/${house_id}/${flat_id}`;
  const isPhoneDelete = deleteObject.includes("номер");
  try {
    const token = localStorage.getItem("token");
    const response = await api.delete(url, {
      headers: {
        "x-token": `${token}`,
      },
    });

    if (response.status !== 200) {
      // Логирование ошибки
      await LogData({
        login,
        page: `Приложение`,
        action: isPhoneDelete
          ? "Кнопка отвязать (Телефон на адресе)"
          : "Кнопка отвязать (Договор на телефоне)",
        success: false,
        url: url,
        payload: { house_id },
        message: `Ошибка: ${
          response.statusText ||
          (isPhoneDelete
            ? "Не удалось отвязать номер"
            : "Не удалось отвязать договор")
        }`,
      });

      toast.error(
        `Ошибка: ${
          response.statusText ||
          (isPhoneDelete
            ? "Не удалось отвязать номер"
            : "Не удалось отвязать договор")
        }`,
        { position: "bottom-right" }
      );
      return;
    }

    // Логирование успешного выполнения
    await LogData({
      login,
      page: `Приложение`,
      action: isPhoneDelete
        ? "Кнопка отвязать (Телефон на адресе)"
        : "Кнопка отвязать (Договор на телефоне)",
      success: true,
      url: url,
      payload: { house_id },
      message: isPhoneDelete
        ? "Телефон успешно отвязан"
        : "Договор успешно отвязан",
    });

    toast.success(
      isPhoneDelete ? "Телефон успешно отвязан" : "Договор успешно отвязан",
      {
        position: "bottom-right",
      }
    );

    // Обновляем данные приложения
    const result = await GetApp(login);

    if (result && "detail" in result) {
      setData(null);
    } else if (result) {
      setData(result);
    } else {
      setData(null);
    }
  } catch (error) {
    // Логирование исключения
    await LogData({
      login,
      page: `Приложение`,
      action: isPhoneDelete
        ? "Кнопка отвязать (Телефон на адресе)"
        : "Кнопка отвязать (Договор на телефоне)",
      success: false,
      url: url,
      payload: { house_id },
      message: `Ошибка: ${String(error)}`,
    });

    toast.error(
      `Ошибка: ${
        error ||
        (isPhoneDelete
          ? "Не удалось отвязать номер"
          : "Не удалось отвязать договор")
      }`,
      {
        position: "bottom-right",
      }
    );
  }
};

export const ChangeRole = async (
  house_id: number,
  flat_id: number,
  role: number,
  login: string,
  setData: React.Dispatch<React.SetStateAction<any>>
) => {
  const url = `/v1/app/change_role`;
  const token = localStorage.getItem("token");

  try {
    await api.patch(
      url,
      {
        house_id,
        flat_id,
        role,
      },
      {
        headers: {
          "x-token": token,
        },
      }
    );

    // Логирование успешного выполнения
    await LogData({
      login,
      page: `Приложение`,
      action: "Изменение роли",
      success: true,
      url: url,
      payload: { house_id, flat_id, role },
      message: "Роль успешно изменена",
    });

    toast.success("Роль успешно изменена", {
      position: "bottom-right",
    });

    // Обновляем данные приложения
    const result = await GetApp(login);

    if (result && "detail" in result) {
      setData(null);
    } else if (result) {
      setData(result);
    } else {
      setData(null);
    }
  } catch (err) {
    const error = err as AxiosError<ApiError>;

    if (error.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return { error: true, message: "Unauthorized" };
    }
    const errorDetail =
      error.response?.data?.detail || "Не удалось изменить роль";

    await LogData({
      login,
      page: `Приложение`,
      action: "Изменение роли",
      success: false,
      url: url,
      payload: { house_id, flat_id, role },
      message: errorDetail,
    });

    toast.error(`${errorDetail || "Не удалось изменить роль"}`, {
      position: "bottom-right",
    });
  }
};

export const Relocate = async (
  phones: number[] | null,
  UUID2: string,
  flat: string,
  address_house_id: number,
  login: string,
  setData: React.Dispatch<React.SetStateAction<any>>
) => {
  const url = `/v1/app/relocate`;

  const requestData: Record<string, any> = {
    UUID2,
    flat,
    address_house_id,
  };

  if (phones && phones.length > 0) {
    requestData.phones = phones;
  }

  try {
    const token = localStorage.getItem("token");
    const response = await api.patch(url, requestData, {
      headers: {
        "x-token": `${token}`,
      },
    });

    if (response.status !== 200) {
      await LogData({
        login,
        page: `Приложение`,
        action: "Переселение",
        success: false,
        url: url,
        payload: { phones, UUID2, flat, address_house_id },
        message: `Ошибка: ${
          response.statusText || "Не удалось переселить договор"
        }`,
      });

      toast.error(
        `Ошибка: ${response.statusText || "Не удалось переселить договор"}`,
        { position: "bottom-right" }
      );
      return;
    }

    // Логирование успешного выполнения
    await LogData({
      login,
      page: `Приложение`,
      action: "Переселение",
      success: true,
      url: url,
      payload: { phones, UUID2, address_house_id, flat },
      message: "Договор успешно переселен",
    });

    toast.success("Договор успешно переселен", {
      position: "bottom-right",
    });

    // Обновляем данные приложения
    const result = await GetApp(login);

    if (result && "detail" in result) {
      setData(null);
    } else if (result) {
      setData(result);
    } else {
      setData(null);
    }
  } catch (error) {
    // Логирование исключения
    await LogData({
      login,
      page: `Приложение`,
      action: "Переселение",
      success: false,
      url: url,
      payload: { phones, UUID2, address_house_id, flat },
      message: `Ошибка: ${String(error)}`,
    });

    toast.error(`Ошибка: ${error || "Не удалось переселить договор"}`, {
      position: "bottom-right",
    });
  }
};
