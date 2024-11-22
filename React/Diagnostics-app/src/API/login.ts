import { AxiosError } from "axios";
import api from "./api"; 

interface ApiError {
    detail: string;
}

interface LoginResponse {
    token: string;
}

const handleLogin = async (username: string, password: string): Promise<LoginResponse | string> => {
    try {

        const response = await api.post<LoginResponse>("/v1/login", {
            name: username,
            password,
        });
        return response.data; 
    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response && error.response.data) {
            // Если ошибка пришла от сервера
            const errorDetail = error.response.data.detail || "Произошла ошибка при авторизации";
            return errorDetail;
        }
        return "Произошла ошибка при авторизации."; 
    }
};

export default handleLogin;

