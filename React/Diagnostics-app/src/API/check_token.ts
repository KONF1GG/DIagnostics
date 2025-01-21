import { AxiosError } from "axios";
import api from "./api";

interface ApiError {
    detail: string;
}

const check_token = async (token: string) => {
    try {
        const response = await api.post("/v1/token", null, {
            headers: {
                'x-token': token, 
            },
        });

        return response.data; 
    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка при проверке токена";
            return errorDetail;
        }
        return "Произошла ошибка при проверке токена."; 
    }
};


export default check_token;
