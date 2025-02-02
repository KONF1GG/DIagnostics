import { AxiosError } from "axios";
import api from "./api";

interface ApiError {
    detail: string;
}

export interface Service {
    name: string;
    status: string;
    count: number;
    price: number;
}

export interface FlusicCameras {
    name: string;
    title: string;
    alive: boolean;
    running: boolean;
    bytes_in: number;
}

export interface Camera1C {
    id: number;
    name: string;
    ipaddress: string;
    available: boolean;
    host: string;
    URL: string;
    archive: number;
    service: string;
    macaddress: string;
    deleted: boolean;
    status?: string;
    type?: string;
}

export interface CameraRedis {
    id: number;
    name: string;
    ipaddress: string;
    available: boolean;
    host: string;
    URL: string;
    houseIds: number[];
    model: string; 
}

export interface FlussonicDiff {
    failed_alive_checks: string[];
    failed_running_checks: string[];
    invalid_bytes_in: string[];
}

export interface ServiceDiff {
    missing_services_in_cameras: string[];
    missing_services_in_1C: string[];
    count_discrepancies: string[];
    status_discrepancies: string[];
    available_discrepancies: string[];
}

export interface CameraDifference {
    Redis?: {
        [key: number]: {
            available?: boolean;
            name?: string;
            ipaddress?: string;
        } | null;
    };
    DB_1C?: {
        [key: number]: {
            name?: string;
            ipaddress?: string;
            available?: boolean;
        };
    };
}
export interface ResponseData {
    services: Service[];
    cameras_from_1c: { cameras: Camera1C[] };
    cameras_from_redis: CameraRedis[];
    flus_diffs: FlussonicDiff;
    cameras_difference: CameraDifference[];
    service_diffs: ServiceDiff;
    cameras_from_flussonic: FlusicCameras[];
}

interface ErrorResponse {
    error: boolean;
    message: string;
}

interface CameraDataToChange {
    id: number;
    name: string;
    ip: string;
    CamType: string;
}

const GetNetwork = async (login: string): Promise<ResponseData | ErrorResponse> => {
    const token = localStorage.getItem('token');

    try {
        const response = await api.get(`/v1/cameras?login=${encodeURIComponent(login)}`, {
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

        // Handle specific error responses
        if (error.response && error.response.status === 401) {
            window.location.href = '/login';
            return { error: true, message: "Unauthorized" };
        } else if (error.response && error.response.data) {
            const errorDetail = error.response.data.detail || "Произошла ошибка получения данных о камерах";
            return {
                error: true,
                message: errorDetail
            };
        }

        // Generic error handling
        return {
            error: true,
            message: "Произошла ошибка получения данных о камерах"
        };
    }
};

export const ChangeCameraData = async (data: CameraDataToChange) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return { error: true, message: "Токен не найден. Пожалуйста, авторизуйтесь." };
    }

    const url = `/camera/${data.id}`;

    try {
        const response = await api.post(url, 
            {
                id: data.id,
                name: data.name,
                ip: data.ip,
                CamType: data.CamType
            },
            {
                headers: {
                    'x-token': token
                }
            }
        );

        if (response.status === 200) {
            return { success: true, message: "Данные камеры успешно изменены" };
        } else {
            return { error: true, message: `Ошибка: ${response.statusText}` };
        }

    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response) {
            const errorDetail = error.response.data.detail || "Произошла ошибка при изменении данных камеры";
            return {
                error: true,
                message: errorDetail
            };
        } else if (error.request) {
            return {
                error: true,
                message: "Не удалось получить ответ от сервера"
            };
        } else {
            return {
                error: true,
                message: "Произошла ошибка при отправке запроса"
            };
        }
    }
};


export { GetNetwork };
