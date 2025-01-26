import { AxiosError } from "axios";
import api from "./api";

interface ApiError {
    detail: string;
}

export interface User {
    id: number;
    name: string;
    role: string;
}

export interface Action {
    name: string;
    date: string;
    login: string;
    page: string;
    action: string;
    status: string;
}

// Update return type to handle both the user list or an error message
const UsersList = async (): Promise<User[] | string> => {
    try {
        const token = localStorage.getItem("token");
        const response = await api.get("/v1/users", {
            headers: {
                'x-token': `${token}`
            }
        });
        return response.data;
    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка получения списка пользователей";
            return errorDetail;
        }
        return "Произошла ошибка получения списка пользователей";
    }
};

export default UsersList;

export const ActionList = async (): Promise<Action[] | string> => {
    try {
        const token = localStorage.getItem("token");
        const response = await api.get("/v1/last_actioins", {
            headers: {
                'x-token': `${token}`
            }
        });
        return response.data;
    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка получения истории изменений";
            return errorDetail;
        }
        return "Произошла ошибка получения истории изменений";
    }
};
