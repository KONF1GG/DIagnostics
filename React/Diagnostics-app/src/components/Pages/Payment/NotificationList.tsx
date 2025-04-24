import { NotificationSMS } from "../../../API/payment";

interface NotificationProps {
  notifications: NotificationSMS[];
}

const NotificationsList = ({ notifications }: NotificationProps) => {
  return (
    <div>
      <table className="table">
        <thead className="table-primary">
          <tr>
            <th>Дата</th>
            <th>Тип уведомления</th>
            <th>Получатели</th>
            <th>Текст сообщения</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((notification, index) => (
            <tr key={index}>
              <td>{notification.dt}</td>
              <td>{notification.notification}</td>
              <td>
                {notification.destination.map((recipient, i) => (
                  <div key={i}>
                    {recipient.name} ({recipient.phone})
                  </div>
                ))}
              </td>
              <td>{notification.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NotificationsList;
