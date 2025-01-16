import React, { useState, useEffect } from "react";
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
    house_id: number
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
  const [phones, setPhones] = useState<string[]>(
    contract?.phone ? [contract.phone] : []
  );

  const handleCheckboxChange = (phone: string) => {
    setPhones((prev) =>
      prev.includes(phone)
        ? prev.filter((num) => num !== phone)
        : [...prev, phone]
    );
  };

  const handleConfirm = () => {
    if (contract?.UUID2 && contract?.house_id) {
      onConfirm(
        contract.login,
        phones,
        contract.UUID2,
        contract.flat,
        contract.house_id
      );
      setPhones([contract?.phone]); 
    }
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
            .filter(
              (phone) =>
                String(phone.phone).slice(-9) !== contract?.phone.slice(-9)
            )
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
