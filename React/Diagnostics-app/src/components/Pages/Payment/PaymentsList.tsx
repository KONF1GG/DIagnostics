import { Payment } from "../../../API/payment";

interface PaymentListProps {
  payments: Payment[];
}

const PaymentList = ({ payments }: PaymentListProps) => {
  return (
    <div>
      <table className="table">
        <thead className="table-primary">
          <tr>
            <th>Дата</th>
            <th>Сумма</th>
            <th>Описание</th>
            <th>Комментарий</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, index) => (
            <tr key={index}>
              <td>{payment.dt}</td>
              <td>{payment.sum} руб.</td>
              <td>{payment.description}</td>
              <td>{payment.comment || "-"}</td>{" "}
              {/* fallback, если комментария нет */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentList;
