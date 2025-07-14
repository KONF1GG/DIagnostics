import React from "react";
import { RBTPhone, RedisLogin } from "../../API/App";
import ClearIcon from "@mui/icons-material/Clear";

interface PhoneCardProps {
  phone: RBTPhone;
  mainContract: string;
  currentFlatId: number;
  onRoleChange: (houseId: number, flatId: number, currentRole: number) => void;
  onDeleteAddress: (
    contract: RedisLogin | undefined,
    phone: RBTPhone | undefined,
    houseId: number,
    flatId: number
  ) => void;
}

const PhoneCard: React.FC<PhoneCardProps> = ({
  phone,
  mainContract,
  currentFlatId,
  onRoleChange,
  onDeleteAddress,
}) => {
  return (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className={`card h-100 bg-light`}>
        <div
          className={`card-header ${phone.role === 0 ? "highlight-owner" : ""}`}
        >
          <div className="dropdown">
            <button
              className="btn dropdown-toggle d-flex justify-content-center align-items-center"
              type="button"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              title="Действия"
              style={{ border: "none" }}
            >
              <div className="text-center w-100">
                <strong>
                  {phone.role === 0 ? "Владелец" : "Пользователь"}
                </strong>
                <h5 className="fw-bold mb-0">
                  {phone.name ? phone.name : "Неизвестное имя"} {phone.phone}
                </h5>
              </div>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={() =>
                    onRoleChange(
                      phone.house_subscriber_id,
                      phone.flat_id,
                      phone.role
                    )
                  }
                >
                  {`Сделать ${
                    phone.role === 0 ? "Пользователем" : "Владельцем"
                  }`}
                </a>
              </li>
              {phone.role !== 0 && (
                <li>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={() => {
                      onDeleteAddress(
                        undefined,
                        phone,
                        phone.house_subscriber_id,
                        phone.flat_id
                      );
                    }}
                  >
                    Отвязать от адреса
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <h5 className="fw-bold mb-0 text-center mt-3">
          {phone.contracts.some(
            (contract) => contract.contract !== mainContract
          )
            ? "Другие адреса, привязанные к этому телефону:"
            : "Других привязанных адресов к этому телефону нет"}
        </h5>

        <div className="card-body">
          <div
            className="contract-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            {phone.contracts.map(
              (contract, idx) =>
                contract.contract !== mainContract && (
                  <div
                    key={idx}
                    className="contract-card border rounded p-3"
                    style={{
                      position: "relative",
                      backgroundColor: "#DCDCDC",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      padding: "1rem",
                    }}
                  >
                    <div>
                      <div>
                        <strong>Логин:</strong> {contract.login}
                      </div>
                      <div>
                        <strong>Адрес:</strong> {contract.address}
                      </div>
                      <div>
                        <strong>Договор:</strong> {contract.contract}
                      </div>
                    </div>
                    {(contract.flat_id !== currentFlatId ||
                      phone.role === 1) && (
                      <button
                        className="btn"
                        onClick={() => {
                          onDeleteAddress(
                            contract,
                            undefined,
                            contract.house_id,
                            contract.flat_id
                          );
                        }}
                        title="Отвязать"
                        style={{
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem",
                          padding: "0.25rem",
                          fontSize: "1rem",
                          width: "auto",
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </button>
                    )}
                  </div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneCard;
