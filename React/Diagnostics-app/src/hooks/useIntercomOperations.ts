import { useState } from 'react';
import { FixManualBlock } from '../components/Pages/Intercom/IntercomRequests';
import { logUserAction, showSuccessToast, showErrorToast } from '../utils/apiHelpers';

export const useIntercomOperations = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fixManualBlock = async (houseFlatId: number, login: string) => {
    setIsLoading(true);
    
    try {
      const result = await FixManualBlock({ house_flat_id: houseFlatId });
      
      if (!result.success) {
        showErrorToast(result.message || "Не удалось исправить manual block");
        
        await logUserAction({
          login,
          page: "Видеонаблюдение",
          action: "Исправление manual block",
          success: false,
          message: result.message || "Ошибка исправления manual block",
          payload: { 
            house_flat_id: houseFlatId,
            error_type: "api_error",
            error_message: result.message
          }
        });
        return false;
      }

      if (result.changed) {
        showSuccessToast(result.message || "Manual block успешно исправлен!");
        
        await logUserAction({
          login,
          page: "Видеонаблюдение",
          action: "Исправление manual block",
          success: true,
          message: result.message || `Manual block исправлен для house_flat_id: ${houseFlatId}`,
          payload: { house_flat_id: houseFlatId }
        });
        return true;
      } else {
        showSuccessToast(result.message || "Manual block уже был выключен");
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка";
      showErrorToast(`Системная ошибка: ${errorMessage}`);
      
      await logUserAction({
        login,
        page: "Видеонаблюдение",
        action: "Исправление manual block",
        success: false,
        message: errorMessage,
        payload: { 
          house_flat_id: houseFlatId,
          error_type: "system_error",
          error_message: errorMessage
        }
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fixManualBlock
  };
};
