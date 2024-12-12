import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { RBTPhone } from "../../../API/App";

interface PhoneModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (selectedNumbers: number[]) => void; // Передаем выбранные номера при подтверждении
  contract: any | null;
  phoneNumbers: RBTPhone[]; 
}

const PhoneModal: React.FC<PhoneModalProps> = ({
  show,
  onClose,
  onConfirm,
  contract,
  phoneNumbers,
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const handleCheckboxChange = (phone: number) => {
    setSelectedNumbers(
      (prev) =>
        prev.includes(phone)
          ? prev.filter((num) => num !== phone) // Убираем номер, если уже выбран
          : [...prev, phone] // Добавляем номер, если не выбран
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedNumbers); // Передаем выбранные номера
    setSelectedNumbers([]); // Сбрасываем состояние после подтверждения
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Подтверждение</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Кого Вы хотите переселить вместе с логином{" "}
          <strong>{contract?.login}</strong>?
        </p>
        <Form>
          {phoneNumbers.map((phone, index) => (
            <Form.Check
              key={index}
              type="checkbox"
              label={phone.phone}
              value={phone.phone}
              checked={selectedNumbers.includes(phone.phone)}
              onChange={() => handleCheckboxChange(phone.phone)}
            />
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleConfirm}>
          Подтвердить
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PhoneModal;
