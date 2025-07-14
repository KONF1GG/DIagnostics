import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { LogData } from '../API/Log';

export interface ApiError {
  detail: string;
}

export interface LogDataParams {
  login: string;
  page: string;
  action: string;
  success: boolean;
  url?: string;
  payload?: any;
  message?: string;
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  const axiosError = error as AxiosError<ApiError>;
  
  if (axiosError.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return 'Unauthorized';
  }
  
  if (axiosError.response?.data?.detail) {
    return axiosError.response.data.detail;
  }
  
  return 'Произошла неизвестная ошибка';
};

export const showSuccessToast = (message: string) => {
  toast.success(message, { position: 'bottom-right' });
};

export const showErrorToast = (message: string) => {
  toast.error(message, { position: 'bottom-right' });
};

export const logUserAction = async (params: LogDataParams) => {
  try {
    await LogData({
      login: params.login,
      page: params.page,
      action: params.action,
      success: params.success,
      url: params.url || window.location.href,
      payload: params.payload || {},
      message: params.message || ''
    });
  } catch (error) {
    console.error('Failed to log user action:', error);
  }
};

export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const message = errorMessage || handleApiError(error);
    showErrorToast(message);
    return null;
  }
};
