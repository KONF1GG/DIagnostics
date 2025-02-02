import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";
import "../CSS/camera.css";
import { ChangeCameraData, GetNetwork } from "../../API/Cameras";
import { toast } from "react-toastify";
import { useDataContext } from "../../DataContext/CamerasContext";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraData1C: any;
  cameraDataRedis: any;
  cameraFlusicData: any;
}

const CameraModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  cameraData1C,
  cameraDataRedis,
  cameraFlusicData,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(cameraData1C?.name || "");
  const { setData, login } = useDataContext();
  const [ipAddress, setIpAddress] = useState(cameraData1C?.ipaddress || "");

  const handleEditClick = () => {
    if (isEditing) {
      // Сброс изменений при отмене
      setName(cameraData1C?.name || "");
      setIpAddress(cameraData1C?.ipaddress || "");
    }
    setIsEditing(!isEditing);
  };

  const handleSaveClick = async () => {
    const dataToSave = {
      id: cameraData1C?.id,
      name,
      ip: ipAddress,
      CamType: "Личная",
    };

    try {
      const response = await ChangeCameraData(dataToSave);
      setIsEditing(false);

      if (response.success) {
        if (login) {
          try {
            const result = await GetNetwork(login);
            if ("error" in result) {
              setData(null);
            } else {
              onClose(); 
              setData(result);
            }
          } catch (fetchError) {
            setData(null);
          }
          toast.success("Камера успешно изменена", {
            position: "bottom-right",
          });
        } else {
          toast.error("Ошибка при изменении камеры", {
            position: "bottom-right",
          });
        }
      }
    } catch (error) {
      toast.error("Ошибка при изменении камеры", { position: "bottom-right" });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>ID: {cameraData1C?.id || "Нет данных"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          {/* Данные из 1С */}
          <div className="col-12 col-lg-4 mb-4">
            <h4>Данные из 1С</h4>
            <Table bordered>
              <tbody>
                <tr>
                  <td>
                    <strong>Название:</strong>
                  </td>
                  <td>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    ) : (
                      cameraData1C?.name || "Нет данных"
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>IP-адрес:</strong>
                  </td>
                  <td>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                      />
                    ) : (
                      cameraData1C?.ipaddress || "Нет данных"
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Хост:</strong>
                  </td>
                  <td>{cameraData1C?.host || "Нет данных"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Доступно:</strong>
                  </td>
                  <td>{cameraData1C?.available ? "Да" : "Нет"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Услуга:</strong>
                  </td>
                  <td>{cameraData1C?.service || "Нет данных"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>MAC-адрес:</strong>
                  </td>
                  <td>{cameraData1C?.macaddress || "Нет данных"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Удалена:</strong>
                  </td>
                  <td>{cameraData1C?.deleted ? "Да" : "Нет"}</td>
                </tr>
              </tbody>
            </Table>
            <div className="edit-buttons">
              <Button variant="primary" onClick={handleEditClick}>
                {isEditing ? "Отмена" : "Изменить"}
              </Button>
              {isEditing && (
                <Button variant="success" onClick={handleSaveClick}>
                  Сохранить
                </Button>
              )}
            </div>
          </div>

          {/* Данные из Redis */}
          <div className="col-12 col-lg-4 mb-4">
            <h4>Данные из Redis</h4>
            <Table bordered>
              <tbody>
                <tr>
                  <td>
                    <strong>Название:</strong>
                  </td>
                  <td>{cameraDataRedis?.name || "Нет данных"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>IP-адрес:</strong>
                  </td>
                  <td>{cameraDataRedis?.ipaddress || "Нет данных"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Хост:</strong>
                  </td>
                  <td>{cameraDataRedis?.host || "Нет данных"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Доступно:</strong>
                  </td>
                  <td>{cameraDataRedis?.available ? "Да" : "Нет"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Модель:</strong>
                  </td>
                  <td>{cameraDataRedis?.Model || "Нет данных"}</td>
                </tr>
              </tbody>
            </Table>
          </div>

          {/* Данные из Flussonic */}
          <div className="col-12 col-lg-4 mb-4">
            <h4>Данные из Flussonic</h4>
            <Table bordered>
              <tbody>
                <tr>
                  <td>
                    <strong>Название:</strong>
                  </td>
                  <td>{cameraFlusicData?.title || "Нет данных"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Доступно:</strong>
                  </td>
                  <td>{cameraFlusicData?.alive ? "Да" : "Нет"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Running:</strong>
                  </td>
                  <td>{cameraFlusicData?.running ? "Да" : "Нет"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Bytes In:</strong>
                  </td>
                  <td>{cameraFlusicData?.bytes_in || "Нет данных"}</td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default CameraModal;
