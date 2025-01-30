import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InfoList from "./InfoList";
import UserEditModal from "../Modals/EditUserModal";
import { Button, Modal } from "react-bootstrap";
import { ChangeUserData, DeleteUser, User, UserData } from "../../API/users"; // Добавлен ChangeUserPassword для изменения пароля
import { toast } from "react-toastify";
import ChangePasswordModal from "../Modals/ChangePasswordModal";

const UserPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false); // Состояние для отображения модалки смены пароля
  const [formData, setFormData] = useState<Partial<User>>({});
  const { userId } = useParams();
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setError("User ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const result = await UserData(userId);

      if (typeof result === "string") {
        setError(result);
      } else if (result) {
        setUser(result);
        setFormData(result);
      }
    } catch (err) {
      setError("Произошла ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    []
  );

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    []
  );

  const handlePasswordChange = async (newPassword: string) => {
    if (!userId) return;

    try {
      const result = await ChangeUserData(userId, {
        password: newPassword,
      });
      if (typeof result === "string") {
        throw new Error(result);
      }
      setShowPasswordModal(false);
      toast.success("Пароль успешно изменен", { position: "bottom-right" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка при смене пароля";
      toast.error(errorMessage, { position: "bottom-right" });
    }
  };

  const handleEditUser = async () => {
    if (!userId || !user) return;

    const changes: Partial<User> = {};

    Object.keys(formData).forEach((key) => {
      const userKey = key as keyof User;

      if (formData[userKey] !== user[userKey]) {
        const value = formData[userKey];

        if (value !== undefined) {
          if (userKey === "role") {
            const roleId =
              value === "admin" ? 1 : value === "user" ? 2 : undefined;

            if (roleId !== undefined) {
              changes["role_id"] = roleId;
            }
          } else {
            changes[userKey] = value;
          }
        }
      }
    });

    if (Object.keys(changes).length === 0) {
      toast.info("Нет изменений для сохранения", { position: "bottom-right" });
      setShowModal(false);
      return;
    }

    try {
      const result = await ChangeUserData(userId, changes);
      if (typeof result === "string") {
        throw new Error(result);
      }

      const updatedUser = await UserData(userId);
      if (typeof updatedUser === "string") {
        throw new Error(updatedUser);
      }

      setUser(updatedUser);
      setFormData(updatedUser);
      setShowModal(false);
      toast.success("Данные успешно обновлены", { position: "bottom-right" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка при обновлении данных";
      toast.error(errorMessage, { position: "bottom-right" });
      console.error(error);
    }
  };

  // Обработчик удаления пользователя
  const handleDeleteUser = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await DeleteUser(userId);
      if (typeof response === "string") {
        throw new Error(response);
      }

      setShowDeleteModal(false);
      toast.success("Пользователь успешно удалён", {
        position: "bottom-right",
      });
      navigate("/users");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Произошла ошибка при удалении";
      toast.error(errorMessage, { position: "bottom-right" });
      setShowDeleteModal(false);
    }
  }, [userId, navigate]);

  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <InfoList>
      <div className="container">
        {error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="user-card">
            {user?.isItself && (
              <span className="badge badge-info">Это вы:</span>
            )}
            <div>
              <h2>
                {user?.lastname} {user?.firstname} {user?.middlename}
              </h2>
            </div>

            <div>
              <p>
                <strong>Логин:</strong> {user?.username}
              </p>
              <p>
                <strong>Роль:</strong>{" "}
                {user?.role === "admin" ? "Администратор" : "Пользователь"}
              </p>
            </div>

            <div className="d-flex justify-content-center">
              {user?.isItself && (
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => setShowPasswordModal(true)}
                  style={{ width: "auto" }}
                >
                  Сменить пароль
                </button>
              )}
              {user?.isItself || user?.current_user_role === "admin" ? (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowModal(true)}
                    style={{ width: "auto" }}
                  >
                    Редактировать
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleDeleteUser}
                    style={{ width: "auto" }}
                  >
                    Удалить
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <UserEditModal
        showModal={showModal}
        formData={formData}
        isItself={user?.isItself || false}
        current_user_role={user?.current_user_role}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleEditUser={handleEditUser}
        handleClose={handleCloseModal}
      />

      {/* Модалка для удаления пользователя */}
      <Modal show={showDeleteModal} onHide={cancelDelete}>
        <Modal.Header closeButton>
          <Modal.Title>
            {user?.isItself ? "Удалить ваш аккаунт?" : "Подтверждение удаления"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {user?.isItself
            ? "Вы уверены, что хотите удалить ваш аккаунт?"
            : "Вы уверены, что хотите удалить этого пользователя?"}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={confirmDeleteUser}>
            Удалить
          </Button>
          <Button variant="secondary" onClick={cancelDelete}>
            Отмена
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модалка для смены пароля */}
      <ChangePasswordModal
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
      />
    </InfoList>
  );
};

export default UserPage;
