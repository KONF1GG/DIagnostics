import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { RBTPhone, LoginsData } from "../../../API/App";

interface PhoneModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (selectedNumbers: number[], selectedNames: string[]) => void;
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
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]); // Состояние для имен

  const handleCheckboxChange = (phone: number, name: string) => {
    setSelectedNumbers((prev) =>
      prev.includes(phone)
        ? prev.filter((num) => num !== phone)
        : [...prev, phone]
    );
    setSelectedNames((prev) =>
      prev.includes(name)
        ? prev.filter((nameItem) => nameItem !== name)
        : [...prev, name]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedNumbers, selectedNames); // Передаем номера и имена
    setSelectedNumbers([]); 
    setSelectedNames([]); 
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
                value={phone.phone}
                checked={selectedNumbers.includes(phone.phone)}
                onChange={() => handleCheckboxChange(phone.phone, phone.name)}
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
