import React, { useEffect, useState } from "react";
import "../CSS/camera.css";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraData1C: any;
  cameraDataRedis: any;
  cameraFlusicData: any;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  cameraData1C,
  cameraDataRedis,
  cameraFlusicData,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(cameraData1C?.name || "");
  const [ipAddress, setIpAddress] = useState(cameraData1C?.ipaddress || "");

  const handleEditClick = () => {
    if (isEditing) {
      // Сброс изменений при отмене
      setName(cameraData1C?.name || "");
      setIpAddress(cameraData1C?.ipaddress || ""); // Сброс IP-адреса
    }
    setIsEditing(!isEditing);
  };

  const handleSaveClick = () => {
    // Логика сохранения нового значения

    console.log("Новое имя:", name);
    console.log("Новый IP-адрес:", ipAddress);
    console.log("ID:", cameraData1C.id);
    console.log("CAMETYPE:", cameraData1C.type);

    setIsEditing(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Закрытие модального окна при клике на оверлей
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="close-button" onClick={onClose}>
          &times;
        </div>
        <h2 className="text-center">ID: {cameraData1C?.id || "Нет данных"}</h2>{" "}
        {/* Заголовок с ID камеры */}
        <div className="row">
          {/* Данные из 1С */}
          <div className="col-md-4">
            <h2>Данные из 1С</h2>
            <table className="table">
              <tbody>
                <tr>
                  <td>
                    <strong>Название:</strong>
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="form-control mb-3"
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
                      <input
                        className="form-control mb-3"
                        type="text"
                        value={ipAddress} // Используем новое состояние для IP-адреса
                        onChange={(e) => setIpAddress(e.target.value)} // Обновляем состояние IP-адреса
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
            </table>
            <div className="edit-buttons">
              <button className="btn btn-primary" onClick={handleEditClick}>
                {isEditing ? "Отмена" : "Изменить"}
              </button>
              {isEditing && (
                <button className="btn btn-success" onClick={handleSaveClick}>
                  Сохранить
                </button>
              )}
            </div>
          </div>

          {/* Данные из Redis */}
          <div className="col-md-4">
            <h2>Данные из Redis</h2>
            <table className="table">
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
            </table>
          </div>

          {/* Данные из Flussonic */}
          <div className="col-md-4">
            <h2>Данные из Flussonic</h2>
            <table className="table">
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
                    <strong>running:</strong>
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
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
