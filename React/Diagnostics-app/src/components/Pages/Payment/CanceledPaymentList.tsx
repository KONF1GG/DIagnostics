import { useState } from "react";
import {
  FailurePay,
  GetPayment,
  PaymentResponseModel,
} from "../../../API/payment";
import formatDateTime from "../Default/formatDateTime";

interface CanceledPaymentListProps {
  login: string;
  canceledPayments: FailurePay[];
  setData: React.Dispatch<React.SetStateAction<any>>;
}

const CanceledPaymentList = ({
  login,
  canceledPayments,
  setData,
}: CanceledPaymentListProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateStatus = async (paymentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/updatePayment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId: paymentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        const result = await GetPayment(login);

        if (result && "detail" in result) {
          setError(result.detail);
          setData(null);
        } else if (result) {
          setData(result as PaymentResponseModel);
        } else {
          setError("Ошибка: данные не получены");
          setData(null);
        }
      } catch {
        setError("Ошибка загрузки данных");
        setData(null);
      } finally {
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Не удалось обновить статус. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <table className="table">
        <thead className="table-primary">
          <tr>
            <th>Дата</th>
            <th>Статус</th>
            <th>Сумма</th>
            <th>Причина</th>
            <th>Описание</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {canceledPayments.map((payment) => (
            <tr key={payment.paymentId}>
              <td>{formatDateTime(payment.timestamp)}</td>
              <td>{payment.status}</td>
              <td>{payment.sum} руб.</td>
              <td>{payment.reason}</td>
              <td>{payment.description}</td>
              <td>
                <button
                  onClick={() => handleUpdateStatus(payment.paymentId)}
                  className="btn btn-primary btn-sm responsive-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Обработка..." : "Обновить статус"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CanceledPaymentList;
