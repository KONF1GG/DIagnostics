import { AxiosError } from "axios";
import api from "./api"; 

interface ApiError {
    detail: string;
}

export interface NetworkData {
    errors: string[]; 
    radius?: {
        GMT: number;
        ip_addr: string;
        onu_mac: string;
        active: boolean;
        json_data: { mac: string; vlan: number };
        time_to: string | null;
    };
    redis?: {
        GMT: number;
        ip_addr: string;
        onu_mac: string;
        active: boolean;
        servicecats?: {
            internet: {
                timeto: number | null;
            } | null;
        };
        mac: string | null;
        vlan: string | null;
    };
    differences?: Record<string, unknown> | null; 
}


const GetNetwork = async (login: string): Promise<NetworkData | string> => {
    const token = localStorage.getItem('token'); 

    try {
        const response = await api.get(`/v1/network?login=${encodeURIComponent(login)}`, {
            headers: {
                'x-token': token 
            }
        });

        console.log(response)
        if (response.status === 401) {
            window.location.href = '/login';
            return "Unauthorized";
        }

        return response.data; 
    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response && error.response.data) {
            // Если ошибка пришла от сервера
            const errorDetail = error.response.data.detail || "Произошла ошибка получения данных о подключении";
            return errorDetail;
        }
        return "Произошла ошибка получения данных о подключении"; 
    }
};

export { GetNetwork };
