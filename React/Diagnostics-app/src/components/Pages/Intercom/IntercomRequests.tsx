import { AxiosError } from "axios";
import api from "../../../API/api";

interface ApiError {
  detail: string;
}

export interface FixManualBlockRequest {
  house_flat_id: number;
}

export interface FixManualBlockResponse {
  success: boolean;
  message?: string;
  changed: boolean;
  house_flat_id: number;
}

const FixManualBlock = async (data: FixManualBlockRequest): Promise<FixManualBlockResponse> => {
  const token = localStorage.getItem("token");
  
  try {
    const response = await api.post<FixManualBlockResponse>(
      "/v1/intercom/fix-manual-block",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
      }
    );

    // Успешный ответ
    return {
      success: true,
      message: response.data.message,
      changed: response.data.changed,
      house_flat_id: response.data.house_flat_id
    };

  } catch (err) {
    const error = err as AxiosError<ApiError>;
    
    // Обработка различных статус-кодов
    if (error.response) {
      switch (error.response.status) {
        case 400: // Bad Request (уже стоит 0)
          return {
            success: false,
            message: error.response.data?.detail || "Manual_block уже выключен",
            changed: false,
            house_flat_id: data.house_flat_id
          };
          
        case 401: // Unauthorized
          window.location.href = "/login";
          throw new Error("Unauthorized");
          
        case 404: // Not Found
          return {
            success: false,
            message: "Квартира не найдена",
            changed: false,
            house_flat_id: data.house_flat_id
          };
          
        default:
          return {
            success: false,
            message: error.response.data?.detail || "Произошла ошибка",
            changed: false,
            house_flat_id: data.house_flat_id
          };
      }
    }
    
    // Ошибка сети или другие необработанные ошибки
    return {
      success: false,
      message: "Сервер недоступен. Попробуйте позже",
      changed: false,
      house_flat_id: data.house_flat_id
    };
  }
};

export { FixManualBlock };