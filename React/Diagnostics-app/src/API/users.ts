import { AxiosError } from "axios";
import api from "./api"; 

interface ApiError {
    detail: string;
}

const UsersList = async () => {
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
