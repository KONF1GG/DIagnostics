import { AxiosError } from "axios";
import api from "./api";

interface ApiError {
    detail: string;
}

export interface FailureData {
    id: string;
    active: boolean;
    host: number;
    address: number;
    message: string;
    node: string | null;
    modified_date: number;
    createdDate: number;
}
export interface ResponseData {
        'isFailure': boolean;
        'failure': FailureData[];
}

interface ErrorResponse {
    error: boolean;
    message: string;
}

const GetFailure = async (login: string): Promise<ResponseData | ErrorResponse> => {
    const token = localStorage.getItem('token');

    try {
        const response = await api.get(`/v1/failure?login=${encodeURIComponent(login)}`, {
            headers: {
                'x-token': token
            }
        });

        if (response.status === 401) {
            window.location.href = '/login';
            return { error: true, message: "Unauthorized" };
        }

        return response.data as ResponseData; 
    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка получения данных о камерах";
            return {
                error: true,
                message: errorDetail
            };
        }

        return {
            error: true,
            message: "Произошла ошибка получения данных о камерах"
        };
    }
};


export { GetFailure };
