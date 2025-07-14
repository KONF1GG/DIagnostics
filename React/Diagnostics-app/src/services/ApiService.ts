import { AxiosError } from 'axios';
import api from '../API/api';
import { handleApiError, logUserAction, LogDataParams } from '../utils/apiHelpers';

interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  logParams?: Omit<LogDataParams, 'success' | 'message'>;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'x-token': token } : {};
  }

  async request<T>(config: RequestConfig): Promise<T | null> {
    const {
      url,
      method = 'GET',
      data,
      headers = {},
      logParams
    } = config;

    try {
      const response = await api.request({
        url,
        method,
        data,
        headers: {
          ...this.getAuthHeaders(),
          ...headers
        }
      });

      if (logParams) {
        await logUserAction({
          ...logParams,
          success: true,
          message: 'Операция выполнена успешно'
        });
      }

      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      
      if (logParams) {
        await logUserAction({
          ...logParams,
          success: false,
          message: errorMessage
        });
      }

      throw new Error(errorMessage);
    }
  }

  async get<T>(url: string, logParams?: Omit<LogDataParams, 'success' | 'message'>): Promise<T | null> {
    return this.request<T>({ url, method: 'GET', logParams });
  }

  async post<T>(url: string, data?: any, logParams?: Omit<LogDataParams, 'success' | 'message'>): Promise<T | null> {
    return this.request<T>({ url, method: 'POST', data, logParams });
  }

  async put<T>(url: string, data?: any, logParams?: Omit<LogDataParams, 'success' | 'message'>): Promise<T | null> {
    return this.request<T>({ url, method: 'PUT', data, logParams });
  }

  async delete<T>(url: string, logParams?: Omit<LogDataParams, 'success' | 'message'>): Promise<T | null> {
    return this.request<T>({ url, method: 'DELETE', logParams });
  }

  async externalRequest<T>(config: RequestConfig): Promise<T | null> {
    const { url, method = 'POST', data, headers = {}, logParams } = config;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (logParams) {
        await logUserAction({
          ...logParams,
          success: true,
          message: response.statusText || 'Операция выполнена успешно'
        });
      }

      return response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (logParams) {
        await logUserAction({
          ...logParams,
          success: false,
          message: errorMessage
        });
      }

      throw new Error(errorMessage);
    }
  }
}

export const apiService = new ApiService();
