import { AxiosError } from "axios";
import api from "./api";

interface ApiError {
    detail: string;
}

export interface LoginData {
    login: string;
    contract: string;
    name: string;
    address: string;
    timeTo: number;
}

interface ResponseData{
    logins: LoginData[];
}

interface ErrorResponse {
    error: boolean;
    message: string;
}

const GetSearchLogins = async (login: string): Promise<ResponseData | ErrorResponse> => {
    const token = localStorage.getItem('token');

    try {
        const response = await api.get(`/v1/search_logins?login=${encodeURIComponent(login)}`, {
            headers: {
                'x-token': token
            }
        });

        return response.data as ResponseData; 
    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response?.status === 401) {
            window.location.href = '/login';
            return { error: true, message: "Unauthorized" };
        }

        if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка получения списка логинов";
            return {
                error: true,
                message: errorDetail
            };
        }

        return {
            error: true,
            message: "Произошла ошибка получения списка логинов"
        };
    }
};


export { GetSearchLogins };
