import React from "react";
import { Modal, Button } from "react-bootstrap";
import { RedisLogin } from "../../API/App";

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: string;
  addContracts: RedisLogin[];
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  title,
  message,
  addContracts,
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
        {addContracts.length > 0 && (
          <>
            <p>
              <strong className="text-warning">ВНИМАНИЕ</strong> Следующие
              адреса также будут отвязаны:{" "}
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {addContracts.map((contract, index) => (
                <div
                  key={index}
                  style={{
                    border: "2px solid #007bff",
                    borderRadius: "5px",
                    padding: "15px",
                    backgroundColor: "#f8f9fa",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <strong>Договор:</strong> {contract.contract}
                  <br />
                  <strong>Логин:</strong> {contract.login}
                  <br />
                  <strong>Адрес:</strong> {contract.address}
                  <br />
                </div>
              ))}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={() => {
            onConfirm();
          }}
        >
          Подтвердить
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            onCancel();
          }}
        >
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;
