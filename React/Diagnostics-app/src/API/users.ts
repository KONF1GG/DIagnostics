import { AxiosError } from "axios";
import api from "./api";

interface ApiError {
    detail: string;
}

export interface Action {
    name: string;
    date: string;
    login: string;
    page: string;
    action: string;
    status: string;
}
export interface User {
    id: number;
    username: string;
    role: string;
    firstname: string;
    lastname: string;
    password: string;
    middlename: string;
    isItself: boolean;
    current_user_role: string;
}

export type UserDataToChange = Partial<User>;

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
        if (error.status === 401) {
            window.location.href = '/login';
            return "Unauthorized";
        }

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

        console.log(response.status);
        return response.data;
    } catch (err) {
        const error = err as AxiosError<ApiError>;
        if (error.status === 401) {
            window.location.href = '/login';
            return "Unauthorized";
        }

        if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка получения истории изменений";
            return errorDetail;
        }
        return "Произошла ошибка получения истории изменений";
    }
};


export const UserData = async (user_id: string): Promise<User | string | null> => {
    try {
        const token = localStorage.getItem("token");
        const response = await api.get(`/v1/user/${user_id}`, {
            headers: {
                'x-token': `${token}`
            }
        });


        return response.data;
    } catch (err) {
        const error = err as AxiosError<ApiError>;
        if (error.status === 401) {
            window.location.href = '/login';
            return "Unauthorized";
        }

        if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка получения данных пользователя";
            return errorDetail;
        }
        return "Произошла ошибка получения данных пользователя";
    }
};


export const DeleteUser = async (user_id: string) => {
    try{
        const token = localStorage.getItem("token");
        const response = await api.delete(`/v1/user/${user_id}`, {
            headers: {
                'x-token': `${token}`
            }
        });



        return response;
    } catch (err){
        const error = err as AxiosError<ApiError>;
        if (error.status === 401) {
            window.location.href = '/login';
            return "Unauthorized";
        }

        if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка удаления пользователя";
            return errorDetail;
        }
        return "Произошла ошибка удаления пользователя";
    }
}

export const ChangeUserData = async (user_id: string, changes: Partial<User>) => {
    try{
        const token = localStorage.getItem("token");
        const response = await api.patch(`/v1/user/${user_id}`, changes, {
            headers: {
                'x-token': `${token}`
            }
        });

        return response;

    } catch (err){
        const error = err as AxiosError<ApiError>;
        if (error.status === 401) {
            window.location.href = '/login';
            return "Unauthorized";
        }

        if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка изменения данных пользователя";
            return errorDetail;
        }
        return "Произошла ошибка изменения данных пользователя";
    }
}
