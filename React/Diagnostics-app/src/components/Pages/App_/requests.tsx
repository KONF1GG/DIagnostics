import { toast } from "react-toastify";
import { LogData } from "../../../API/Log";
import { GetApp } from "../../../API/App";

export const handleContractDeleteButton = async (
  uuid2: string,
  login: string,
  setData: React.Dispatch<React.SetStateAction<any>>
) => {
  console.log(`Кнопка отвязать нажата!`);
  const requestData = {
    UUID2: uuid2,
    flatId: 0,
  };
  try {
    console.log("Отправляем запрос с данными:", requestData);
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
      console.log(result);
      setData(null);
    } else if (result) {
      setData(result);
    } else {
      setData(null);
    }
  } catch (error) {
    // Логирование исключения
    console.log(error)
    await LogData({
      login,
      page: `Приложение`,
      action: "Кнопка отвзяать (Договор на адресе)",
      success: false,
      url: "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/correctTV",
      payload: requestData,
      message: `Ошибка: ${String(error)}`,
    });

    toast.error(`Ошибка: ${error || "Не удалось отвязать договор"}`, {
      position: "bottom-right",
    });
  }
};
