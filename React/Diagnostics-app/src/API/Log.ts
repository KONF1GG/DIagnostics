import { AxiosError } from "axios";
import api from "./api";

interface ApiError {
  detail: string;
}

export interface Data {
  login: string;
  page: string;
  action: string;
  success: boolean;
  message: string;
  url: string;
  payload: Record<string, any>;
}

const LogData = async (data: Data): Promise<string> => {
  const token = localStorage.getItem("token");
  try {
    
    const response = await api.post("/v1/log", data, {
      headers: {
        "Content-Type": "application/json",
        "x-token": token, 
      },
    });

    // Проверяем статус ответа
    if (response.status === 201 || response.status === 200) {
      return "Данные успешно залогированы.";
    } else if (response.status === 401) {
      window.location.href = "/login";
      return "Unauthorized";
    }

    return "Неизвестная ошибка.";
  } catch (err) {
    const error = err as AxiosError<ApiError>;


    if (error.response && error.response.data) {
      const errorDetail = error.response.data.detail || "Произошла ошибка записи лога.";
      console.error("Ошибка от сервера:", errorDetail);
      return errorDetail;
    }

    console.error("Ошибка сети или сервера:", error.message);
    return "Произошла ошибка записи лога.";
  }
};

export { LogData };
