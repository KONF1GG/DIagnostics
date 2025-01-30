import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const ChangePasswordModal: React.FC<{
  show: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}> = ({ show, onClose, onSubmit }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    onSubmit(password);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Сменить пароль</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="newPassword" className="mb-3">
            <Form.Label>Новый пароль</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Введите новый пароль"
            />
          </Form.Group>

          <Form.Group controlId="confirmPassword" className="mb-3">
            <Form.Label>Подтверждение пароля</Form.Label>
            <Form.Control
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Подтвердите новый пароль"
            />
          </Form.Group>

          {error && <div className="alert alert-danger">{error}</div>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit}>
          Сохранить
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChangePasswordModal;
