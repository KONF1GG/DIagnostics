import { Payment } from "../../../API/payment";
import formatDateTime from "../Default/formatDateTime";

interface PaymentListProps {
  payments: Payment[];
}


const PaymentList = ({ payments }: PaymentListProps) => {
  return (
    <div>
      <table className="table">
        <thead className="table-primary">
          <tr>
            <th>Дата и время</th>
            <th>Сумма</th>
            <th>Описание</th>
            <th>Комментарий</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, index) => (
            <tr key={index}>
              <td>{formatDateTime(payment.timestamp)}</td>
              <td>{payment.sum} руб.</td>
              <td>{payment.description}</td>
              <td>{payment.comment || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentList;
