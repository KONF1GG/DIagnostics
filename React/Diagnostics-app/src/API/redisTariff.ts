import { AxiosError } from "axios";
import api from "./api";

interface ApiError {
  detail: string;
}

export interface RedisTariffApiResponse {
  tariffs: any;
}

const GetRedisTariff = async (
  territoryId: string
): Promise<RedisTariffApiResponse | ApiError | null> => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return null;
  }

  try {
    const response = await api.get(
      `/v1/redis_tariff?territory_id=${encodeURIComponent(territoryId)}`,
      {
        headers: {
          "x-token": token,
        },
      }
    );

    return response.data as RedisTariffApiResponse;
  } catch (err) {
    const error = err as AxiosError<ApiError>;

    if (error.response?.status === 401) {
      window.location.href = "/login";
      return null;
    }

    if (error.response?.data?.detail) {
      return { detail: error.response.data.detail };
    }

    return { detail: "Ошибка получения тарифов" };
  }
};

export { GetRedisTariff };
