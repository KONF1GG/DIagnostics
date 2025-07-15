import { AxiosError } from "axios";
import api from "./api";

export interface RedisAddressModel {
  id: number;
  address: string;
  territory_id: string;
  territory_name: string;
}

export interface RedisAddressModelResponse {
  addresses: RedisAddressModel[];
}

export interface ApiError {
  detail: string;
}

export const getRedisAddresses = async (
  query_address: string
): Promise<RedisAddressModelResponse | ApiError | null> => {
  const token = localStorage.getItem("token");
  
  try {
    const response = await api.get<RedisAddressModelResponse>(
      `/v1/redis_addresses`,
      {
        params: { query_address },
        headers: {
          "x-token": token,
        },
      }
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiError>;
    
    if (error.response?.status === 401) {
      window.location.href = "/login";
      return null;
    }
    
    if (error.response?.status === 404) {
      // 404 - это нормально, территории просто не найдены
      return { addresses: [] };
    }
    
    if (error.response && error.response.data && "detail" in error.response.data) {
      return { detail: error.response.data.detail };
    }
    
    console.error("Произошла ошибка при поиске адресов Redis:", error);
    return { detail: "Сервис поиска недоступен" };
  }
};
