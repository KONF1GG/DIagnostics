import { useState } from 'react';
import { GetPayment, PaymentResponseModel } from '../API/payment';
import { withErrorHandling, logUserAction, showSuccessToast } from '../utils/apiHelpers';

export const usePaymentOperations = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updatePaymentStatus = async (paymentId: string, login: string) => {
    setIsLoading(true);
    
    const result = await withErrorHandling(async () => {
      const response = await fetch(
        "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/updatePayment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await logUserAction({
        login,
        page: 'Оплата',
        action: 'Обновление статуса платежа',
        success: true,
        payload: { paymentId }
      });

      return await GetPayment(login);
    });

    setIsLoading(false);
    return result;
  };

  const unsubscribeRecurring = async (login: string) => {
    setIsLoading(true);

    const result = await withErrorHandling(async () => {
      const response = await fetch(
        "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/delRecPayment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login }),
        }
      );

      if (!response.ok) {
        throw new Error(response.statusText || "Не удалось отключить подписку");
      }

      await logUserAction({
        login,
        page: 'Оплата',
        action: 'Кнопка отвязать (Автоплатеж)',
        success: true,
        payload: { login },
        message: "Автоплатеж успешно отвязан"
      });

      showSuccessToast("Автоплатеж успешно отвязан");
      return await GetPayment(login);
    });

    setIsLoading(false);
    return result;
  };

  return {
    isLoading,
    updatePaymentStatus,
    unsubscribeRecurring
  };
};
