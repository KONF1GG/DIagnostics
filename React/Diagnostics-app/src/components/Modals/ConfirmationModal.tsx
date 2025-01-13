import React from "react";
import { Modal, Button } from "react-bootstrap";

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
}) => {

  return (
    <Modal show={show} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => { 
          console.log("Подтвердить нажато"); 
          onConfirm(); 
        }}>
          Подтвердить
        </Button>
        <Button variant="secondary" onClick={() => { 
          console.log("Отмена нажата"); 
          onCancel(); 
        }}>
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;
