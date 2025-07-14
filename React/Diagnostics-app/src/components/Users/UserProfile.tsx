import React from "react";
import { User } from "../../API/users";

interface UserProfileProps {
  user: User;
  onEdit: () => void;
  onChangePassword: () => void;
  onDelete: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onEdit,
  onChangePassword,
  onDelete,
}) => {
  const canManage = user.isItself || user.current_user_role === "admin";

  return (
    <div className="user-card">
      {user.isItself && <span className="badge badge-info">Это вы:</span>}
      <div>
        <h2>
          {user.lastname} {user.firstname} {user.middlename}
        </h2>
      </div>

      <div>
        <p>
          <strong>Логин:</strong> {user.username}
        </p>
        <p>
          <strong>Роль:</strong>{" "}
          {user.role === "admin" ? "Администратор" : "Пользователь"}
        </p>
      </div>

      <div className="d-flex justify-content-center">
        {canManage && (
          <button
            className="btn btn-warning btn-sm"
            onClick={onChangePassword}
            style={{ width: "auto" }}
          >
            Сменить пароль
          </button>
        )}
        {canManage && (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={onEdit}
              style={{ width: "auto" }}
            >
              Редактировать
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={onDelete}
              style={{ width: "auto" }}
            >
              Удалить
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
