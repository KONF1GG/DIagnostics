import { AxiosError } from "axios";
import api from "./api"; 

interface ApiError {
    detail: string;
}

export interface Payment {
    dt: string;
    timestamp: number;
    sum: number;
    description: string;
    comment: string;
}

export interface FailurePay {
    dt: string;
    timestamp: number;
    status: string;
    sum: number;
    reason: string;
    autopayment: boolean;
    description: string;
    paymentId: string;
}

export interface RecPaymnent {
    recurringPayment: string | null;
}

interface Destination {
    name: string;
    phone: string;
}

export interface NotificationSMS {
    notification: string;
    destination: Destination[];
    text: string;
    dt: string;
}


export interface PaymentResponseModel {
    payments: Payment[];
    canceled_payments: FailurePay[];
    recurringPayment: RecPaymnent;
    notifications: NotificationSMS[];
}

const GetPayment = async (login: string): Promise<PaymentResponseModel | ApiError | null> => {
    const token = localStorage.getItem('token'); 

    try {
        const response = await api.get(`/v1/payment?login=${encodeURIComponent(login)}`, {
            headers: {
                'x-token': token 
            }
        });

        if (response.status === 401) {
            window.location.href = '/login';
            return null;
        }

        return response.data; 
    } catch (err) {
        const error = err as AxiosError<ApiError>;

        if (error.response) {
            if (error.response.data && "detail" in error.response.data) {
                return { detail: error.response.data.detail };
            } else {
                return { detail: "Неизвестная ошибка сервера" };
            }
        } else if (error.request) {
            return { detail: "Ошибка сети: сервер не отвечает" };
        } else {
            console.error("Ошибка при формировании запроса:", error.message);
            return { detail: "Ошибка при отправке запроса" };
        }
    }
};

export { GetPayment };