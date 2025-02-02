import React from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { User } from "../../API/users";
import { toast } from "react-toastify";

interface UserEditModalProps {
  showModal: boolean;
  formData: Partial<User>;
  isItself: boolean;
  current_user_role: string | undefined;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditUser: () => void;
  handleClose: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  showModal,
  formData,
  handleInputChange,
  handleSelectChange,
  handleEditUser,
  handleClose,
}) => {
  // Функция для рендеринга общих полей
  const renderInputField = (
    label: string,
    name: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  ) => (
    <Form.Group controlId={name} className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="text"
        name={name}
        value={value || ""}
        onChange={onChange}
      />
    </Form.Group>
  );

  // Валидация обязательных полей
  const handleSaveChanges = () => {
    if (!formData.username || !formData.firstname || !formData.lastname) {
      toast.error("Пожалуйста, заполните все обязательные поля.", {
        position: "bottom-right",
      });
      return;
    }
    handleEditUser();
  };

  return (
    <Modal show={showModal} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Редактирование пользователя</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {renderInputField(
            "Логин",
            "username",
            formData.username || "",
            handleInputChange
          )}
          {renderInputField(
            "Имя",
            "firstname",
            formData.firstname || "",
            handleInputChange
          )}
          {renderInputField(
            "Фамилия",
            "lastname",
            formData.lastname || "",
            handleInputChange
          )}
          {renderInputField(
            "Отчество",
            "middlename",
            formData.middlename || "",
            handleInputChange
          )}

          <Form.Group controlId="role" className="mb-3">
            <Form.Label>Роль</Form.Label>
            <Form.Control
              as="select"
              name="role"
              value={formData.role || "user"}
              onChange={handleSelectChange}
              disabled={
                formData.isItself || formData.current_user_role === "user"
              }
            >
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </Form.Control>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSaveChanges}>
          Сохранить
        </Button>
        <Button variant="secondary" onClick={handleClose}>
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserEditModal;
