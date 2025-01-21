import { toast } from "react-toastify";
import api from "../../../../API/api";
import { AxiosError } from "axios";
import { ApiError } from "../../../../API/App";

export const Get = async (
  login: string,
  setData: React.Dispatch<React.SetStateAction<any>>
) => {
  const url = `/v1/redis_data`;
  const token = localStorage.getItem("token");

  try {
    const response = await api.get(url, {
      params: { login },
      headers: {
        "x-token": token,
      },
    });

    setData(response.data);
  } catch (err) {
    const error = err as AxiosError<ApiError>;

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    const errorDetail =
      error.response?.data?.detail || "Не удалось получить данные по логину";

    toast.error(errorDetail, {
      position: "bottom-right",
    });
  }
};
