import { RecPaymnent } from "../../../API/payment";

interface RecurringPaymentProps {
  recurringPayment: RecPaymnent;
}

const RecurringPayment: React.FC<RecurringPaymentProps> = ({
  recurringPayment,
}) => {
  const handleUnsubscribe = () => {
    console.log("Отвязать подписку");
    // API вызов будет здесь
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
      >
        Отвязать
      </button>
    </div>
  );
};
export default RecurringPayment;
