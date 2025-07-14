import { useState } from 'react';
import { GetTV } from '../API/TV';
import { apiService } from '../services/ApiService';
import { showSuccessToast, showErrorToast } from '../utils/apiHelpers';

export const useTVOperations = () => {
  const [loadingButton, setLoadingButton] = useState<string | null>(null);

  const makePrimary = async (phone: string, login: string, setData: any) => {
    setLoadingButton(`make-primary-${phone}`);
    
    try {
      await apiService.externalRequest({
        url: "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/main24phone",
        method: "POST",
        data: { login, phone },
        logParams: {
          login,
          page: `TV(24ТВ)`,
          action: "Сделать основным",
          payload: { login, phone }
        }
      });

      showSuccessToast("Телефон сделан основным");
      const result = await GetTV(login);
      setData(result);
    } catch (error) {
      showErrorToast("Ошибка: Не удалось изменить основной номер");
    } finally {
      setLoadingButton(null);
    }
  };

  const changeRegion = async (phone: string, login: string, setData: any) => {
    setLoadingButton(`make-primary-${phone}`);
    
    try {
      await apiService.externalRequest({
        url: "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/main24phone",
        method: "POST",
        data: { login, phone, changeOperator: true },
        logParams: {
          login,
          page: `TV(${phone})`,
          action: "Изменение региона",
          payload: { login, phone, changeOperator: true }
        }
      });

      showSuccessToast("Регион успешно изменен!");
      const result = await GetTV(login);
      setData(result);
    } catch (error) {
      showErrorToast("Ошибка: Не удалось обновить настройки");
    } finally {
      setLoadingButton(null);
    }
  };

  const updateSettings = async (
    login: string,
    operator: string,
    not_turnoff_if_not_used: boolean,
    ban_on_app: boolean
  ) => {
    try {
      await apiService.externalRequest({
        url: "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/settingsTV",
        method: "POST",
        data: { login, operator, not_turnoff_if_not_used, ban_on_app },
        logParams: {
          login,
          page: `TV(${operator})`,
          action: "Изменение настроек",
          payload: { login, operator, not_turnoff_if_not_used, ban_on_app }
        }
      });

      return { success: true, message: "Настройки успешно обновлены" };
    } catch (error) {
      return { success: false, message: "Ошибка подключения к серверу" };
    }
  };

  const correctTV = async (operator: string, login: string, setData: any, setIsLoading: any) => {
    setIsLoading(true);

    try {
      await apiService.externalRequest({
        url: "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/correctTV",
        method: "POST",
        data: { login, operator },
        logParams: {
          login,
          page: `TV(${operator})`,
          action: "correctTV",
          payload: { login, operator }
        }
      });

      showSuccessToast("Синхронизация статусов запущена");
      setTimeout(() => setIsLoading(false), 5000);
      const result = await GetTV(login);
      setData(result);
    } catch (error) {
      showErrorToast("Ошибка: Не удалось обновить настройки");
      setIsLoading(false);
    }
  };

  return {
    loadingButton,
    makePrimary,
    changeRegion,
    updateSettings,
    correctTV
  };
};
