import { AxiosError } from "axios";
import api from "./api";

export interface FridaResponse {
  response: string;
}

export interface ApiError {
  detail: string;
}

const GetFridaAnswer = async (
  query: string,
  historyCount: number,
  model?: string,
  tariffs?: any,
  abortSignal?: AbortSignal
): Promise<FridaResponse | ApiError | null> => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return null;
  }

  try {
    const requestBody = {
      query: query,
      history_count: historyCount,
      ...(model && { model }),
      ...(tariffs && { tariffs })
    };

    const response = await api.post("/v1/frida", requestBody, {
      headers: {
        "x-token": token,
      },
      signal: abortSignal,
    });

    return response.data as FridaResponse;
  } catch (err) {
    const error = err as AxiosError<ApiError>;

    if (error.response?.status === 401) {
      window.location.href = "/login";
      return null;
    }

    // Проверяем на отмену запроса
    if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return { detail: "Запрос отменен" };
    }

    if (error.response?.data?.detail) {
      return { detail: error.response.data.detail };
    }

    return { detail: "Ошибка сети или сервера" };
  }
};

export { GetFridaAnswer };