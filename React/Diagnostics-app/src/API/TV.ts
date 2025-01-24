import { AxiosError } from "axios";
import api from "./api";

interface ApiError {
    detail: string;
}

export interface Service {
    id: string;
    name: string;
    status: string;
}

export interface Smotreshka {
    login: string | null;
    password: string | null;
    not_turnoff_if_not_used: boolean | null;
    service1c: Service[];
    serviceOp: Service[];
    ban_on_app: boolean | null;
    error: string | null;
}

export interface TVIP {
    login: string | null;
    password: string | null;
    service1c: Service[];
    serviceOp: Service[];
    error: string | null;
}

interface additional_phone {
    phone: string;
    operator: string;
}

export interface TV24 {
    phone: additional_phone | null;
    service1c: Service[];
    serviceOp: Service[];
    additional_phones: additional_phone[];
    ban_on_app: boolean | null;
    isKRD: boolean | null
    error: string | null;
}

export interface Error {
    _1c: string | null
}

export interface ResponseData {
    smotreshka: Smotreshka;
    tvip: TVIP;
    tv24: TV24;
    errors: Error;
}

export const GetTV = async (login: string): Promise<ResponseData | null> => {
    const token = localStorage.getItem("token");

    try {
        const response = await api.get<ResponseData>(`/v1/TV?login=${encodeURIComponent(login)}`, {
            headers: {
                "x-token": token,
            },
        });

        console.log(response.data)
        if (response.status === 401) {
            window.location.href = "/login";
            return null;
        }

        return response.data;
    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response && error.response.data && "detail" in error.response.data) {
            console.error("Ошибка:", error.response.data.detail);
        } else {
            console.error("Произошла ошибка получения данных о TV");
        }

        return null; 
    }
};
