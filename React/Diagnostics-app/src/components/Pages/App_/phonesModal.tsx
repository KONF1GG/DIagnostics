import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { RBTPhone, LoginsData } from "../../../API/App";

interface PhoneModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (
    login: string,
    selectedNumbers: string[],
    UUID2: string,
    flat: string,
    address_house_id: number
  ) => void;
  contract: LoginsData | null;
  phoneNumbers: RBTPhone[];
}

const PhoneModal: React.FC<PhoneModalProps> = ({
  show,
  onClose,
  onConfirm,
  contract,
  phoneNumbers,
}) => {
  const [phones, setPhones] = useState<string[]>([]);

  const handleCheckboxChange = (phone: string) => {
    setPhones((prev) =>
      prev.includes(phone)
        ? prev.filter((num) => num !== phone)
        : [...prev, phone]
    );
  };

  const handleConfirm = () => {
    if (contract?.UUID2 && contract?.address_house_id) {
      onConfirm(
        contract.login,
        phones,
        contract.UUID2,
        contract.flat,
        contract.address_house_id
      );
    }
    // Очистка выбранных номеров после подтверждения
    setPhones([]);
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Переселение</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Кого Вы хотите переселить вместе с <strong>{contract?.name}</strong>
          <strong>
            {" ("}
            {contract?.login}
            {") ?"}
          </strong>
        </p>
        <Form>
          {phoneNumbers
            .filter(() => contract?.phone)
            .map((phone, index) => (
              <Form.Check
                key={index}
                type="checkbox"
                label={`${phone.name} - ${phone.phone}`}
                value={String(phone.phone)}
                checked={phones.includes(String(phone.phone))}
                onChange={() => handleCheckboxChange(String(phone.phone))}
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
