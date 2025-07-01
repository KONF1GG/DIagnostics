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
  model?: string
): Promise<FridaResponse | ApiError | null> => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return null;
  }

  try {
    let url = `/v1/frida?query=${encodeURIComponent(
      query
    )}&history_count=${historyCount}`;
    
    if (model) {
      url += `&model=${encodeURIComponent(model)}`;
    }

    const response = await api.get(url, {
      headers: {
        "x-token": token,
      },
    });

    return response.data as FridaResponse;
  } catch (err) {
    const error = err as AxiosError<ApiError>;

    if (error.response?.status === 401) {
      window.location.href = "/login";
      return null;
    }

    if (error.response?.data?.detail) {
      return { detail: error.response.data.detail };
    }

    return { detail: "Ошибка сети или сервера" };
  }
};

export { GetFridaAnswer };