import { AxiosError } from "axios";
import api from "./api";

export interface RedisLogin {
  login: string;
  address: string;
  contract: string;
}

export interface RBTPhone {
  phone: number; // id
  name: string;
  patronymic: string;
  contracts: RedisLogin[];
}

export interface LoginsData {
  login: string;
  name: string;
  address: string;
  contract: string;
}

export interface ResponseData {
  address_in_app: string;
  contracts: LoginsData[];
  phones: RBTPhone[];
}

interface ApiError {
  detail: string;
}

export const GetApp = async (
  login: string
): Promise<ResponseData | ApiError | null> => {
  const token = localStorage.getItem("token");

  try {
    const response = await api.get<ResponseData>(
      `/v1/app?login=${encodeURIComponent(login)}`,
      {
        headers: {
          "x-token": token,
        },
      }
    );

    console.log(response.status);
    if (response.status === 401) {
      window.location.href = "/login";
      return null;
    }

    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiError>;

    if (
      error.response &&
      error.response.data &&
      "detail" in error.response.data
    ) {
      if (error.status == 404) {
        return { detail: error.response.data.detail };
      }
    } else {
      console.error("Произошла ошибка получения данных для Приложения");
    }

    return null;
  }
};
