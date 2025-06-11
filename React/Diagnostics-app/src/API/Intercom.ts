import { AxiosError } from "axios";
import api from "./api";

interface ApiError {
  detail: string;
}

export interface IntercomService {
  service: string;
  category: string;
  timeto: string;
}

export interface CategoryStatus {
  service: string;
  category: string;
  timeto_1c: number | null;
  timeto_redis: number | null;
  status: "match" | "discrepancy" | "only_in_1c" | "only_in_redis" | "missing";
}

export interface RBTApsSettings {
  address_house_id: number;
  manual_block?: boolean;
  auto_block?: boolean;
  open_code?: string;
  white_rabbit?: boolean;
  admin_block?: boolean;
}

export interface Passage {
  date: string; 
  address: string;
  type: string;
}

export interface IntercomResponse {
  categories: CategoryStatus[];
  errors: string[];
  update_instructions: string | null;
  aps_settings: RBTApsSettings | null;
  rbt_link: string;
  passages: Passage[];
}

const GetIntercom = async (login: string): Promise<IntercomResponse | ApiError | null> => {
  const token = localStorage.getItem("token");

  try {
    const response = await api.get(`/v1/intercom?login=${encodeURIComponent(login)}`, {
      headers: {
        "x-token": token,
      },
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return null;
    }

    return response.data as IntercomResponse;
  } catch (err) {
    const error = err as AxiosError<ApiError>;

    if (error.response) {
      if (error.response.data && "detail" in error.response.data) {
        return { detail: error.response.data.detail };
      } else {
        return { detail: "Неизвестная ошибка сервера" };
      }
    } else if (error.request) {
      return { detail: "Ошибка сети: сервер не отвечает" };
    } else {
      console.error("Ошибка при формировании запроса:", error.message);
      return { detail: "Ошибка при отправке запроса" };
    }
  }
};

export { GetIntercom };