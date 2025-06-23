import { useState } from "react";
import { toast } from "react-toastify";
import { FixManualBlock } from "./IntercomRequests";
import { LogData } from "../../../API/Log";
import { Button, Spinner } from "react-bootstrap";

interface FixManualBlockButtonProps {
  houseFlatId: number;
  onFixed?: () => void;
  login: string;
}

const FixManualBlockButton = ({ houseFlatId, onFixed, login }: FixManualBlockButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFixClick = async () => {
    setIsLoading(true);
    
    try {
      const result = await FixManualBlock({ house_flat_id: houseFlatId });
      
      if (!result.success) {
        // Обработка ожидаемых ошибок (400, 404 и т.д.)
        toast.warning(result.message || "Не удалось исправить manual block", {
          position: "bottom-right",
          autoClose: 5000,
        });

        await LogData({
          login,
          page: "Видеонаблюдение",
          action: "Исправление manual block",
          success: false,
          message: result.message || "Ошибка исправления manual block",
          url: window.location.pathname,
          payload: { 
            house_flat_id: houseFlatId,
            error_type: "api_error",
            error_message: result.message
          }
        });
        return;
      }

      if (result.changed) {
        // Успешное изменение
        toast.success(result.message || "Manual block успешно исправлен!", {
          position: "bottom-right",
          autoClose: 3000,
        });

        await LogData({
          login,
          page: "Видеонаблюдение",
          action: "Исправление manual block",
          success: true,
          message: result.message || `Manual block исправлен для house_flat_id: ${houseFlatId}`,
          url: window.location.pathname,
          payload: { house_flat_id: houseFlatId }
        });

        if (onFixed) onFixed();
      } else {
        // Значение уже было корректным
        toast.info(result.message || "Manual block уже был выключен", {
          position: "bottom-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      // Обработка непредвиденных ошибок (network errors и т.д.)
      const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка";
      
      toast.error(`Системная ошибка: ${errorMessage}`, {
        position: "top-right",
        autoClose: 7000,
      });
      
      await LogData({
        login,
        page: "Видеонаблюдение",
        action: "Исправление manual block",
        success: false,
        message: errorMessage,
        url: window.location.pathname,
        payload: { 
          house_flat_id: houseFlatId,
          error_type: "system_error",
          error_message: errorMessage
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fix-manual-block-container">
      <Button
        variant="outline-danger"
        size="sm"
        onClick={handleFixClick}
        disabled={isLoading}
        className="fix-manual-block-btn"
        aria-label="Исправить manual block"
      >
        {isLoading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Обработка...
          </>
        ) : (
          "Исправить"
        )}
      </Button>
    </div>
  );
};

export default FixManualBlockButton;