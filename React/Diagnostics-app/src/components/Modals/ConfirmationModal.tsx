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
          onConfirm(); 
        }}>
          Подтвердить
        </Button>
        <Button variant="secondary" onClick={() => { 
          onCancel(); 
        }}>
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;
