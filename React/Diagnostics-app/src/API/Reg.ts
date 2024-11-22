import { AxiosError } from "axios";
import api from "./api"; 

interface ApiError {
    detail: string;
}

interface ItemId {
    id: number;
}

const Reg = async (username: string, password: string): Promise<ItemId | string> => {
    try {
        const response = await api.post<ItemId>("/v1/reg", {
            name: username,
            password, 
        });

        return response.data; 
    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка при создании пользователя";
            return errorDetail;
        }
        return "Произошла ошибка при создании пользователя."; 
    }
};

export default Reg;
