import React from "react";
import {
  useNotifications,
  Notification,
} from "../../contexts/NotificationContext";

const NotificationItem: React.FC<{
  notification: Notification;
  onRemove: (id: string) => void;
}> = ({ notification, onRemove }) => {
  const getIconForType = (type: string) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
      default:
        return "ℹ";
    }
  };

  return (
    <div
      className={`notification notification-${notification.type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="notification-content">
        <span className="notification-icon">
          {getIconForType(notification.type)}
        </span>
        <div className="notification-text">
          {notification.title && (
            <div className="notification-title">{notification.title}</div>
          )}
          <div className="notification-message">{notification.message}</div>
        </div>
        <button
          className="notification-close"
          onClick={() => onRemove(notification.id)}
          aria-label="Закрыть уведомление"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
