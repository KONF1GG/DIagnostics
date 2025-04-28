import { RecPaymnent } from "../../../API/payment";
import { toast } from "react-toastify";
import { LogData } from "../../../API/Log";
import { useState } from "react";

interface RecurringPaymentProps {
  recurringPayment: RecPaymnent;
  login: string;
}

const RecurringPayment: React.FC<RecurringPaymentProps> = ({
  recurringPayment,
  login,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(
        "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/delRecPaymen",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            login: login,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(response.statusText || "Не удалось отключить подписку");
      }

      // Логирование успешного действия
      await LogData({
        login,
        page: "Оплата",
        action: "Кнопка отвязать (Автоплатеж)",
        success: true,
        url: window.location.href,
        payload: { login: login },
        message: "Автоплатеж успешно отвязан",
      });

      toast.success("Автоплатеж успешно отвязан", {
        position: "bottom-right",
      });

    } catch (error) {
      console.error("Error unsubscribing:", error);

      // Логирование ошибки
      await LogData({
        login,
        page: "Оплата",
        action: "Кнопка отвязать (Автоплатеж)",
        success: false,
        url: window.location.href,
        payload: { login: login },
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
      });

      toast.error(
        `Ошибка: ${error instanceof Error ? error.message : "Не удалось отключить подписку"}`,
        { position: "bottom-right" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-between gap-3 p-2 border rounded mb-3">
      <div className="flex-grow-1 me-2">
        {recurringPayment.recurringPayment || "Нет данных о автоплатеже"}
      </div>

      <button
        onClick={handleUnsubscribe}
        className="btn btn-outline-danger btn-sm"
        style={{
          fontSize: "0.875rem",
          flex: "0 0 auto",
          width: "100px",
        }}
        disabled={isLoading}
      >
        {isLoading ? (
          <output className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
        ) : (
          "Отвязать"
        )}
      </button>
    </div>
  );
};

export default RecurringPayment;