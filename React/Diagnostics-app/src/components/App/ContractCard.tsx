import React from "react";
import { LoginsData } from "../../API/App";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import EditLocationIcon from "@mui/icons-material/EditLocation";

interface ContractCardProps {
  contract: LoginsData;
  onRelocate: (contract: LoginsData) => void;
  onDelete: (contract: LoginsData) => void;
}

const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onRelocate,
  onDelete,
}) => {
  return (
    <tr className="align-middle">
      <td className="text-center align-middle">{contract.login}</td>
      <td className="text-center align-middle">{contract.name}</td>
      <td className="text-center align-middle">{contract.address}</td>
      <td className="text-center align-middle">{contract.contract}</td>
      <td className="text-center">
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {contract.relocate && contract.relocate !== "None" && (
            <button
              className="btn btn-primary"
              onClick={() => onRelocate(contract)}
              title="Переселить"
              style={{ width: "50px", height: "50px" }}
            >
              <EditLocationIcon />
            </button>
          )}
          {contract.active && (
            <button
              className="btn btn-danger"
              onClick={() => onDelete(contract)}
              title="Отвязать"
              style={{ width: "50px", height: "50px" }}
            >
              <PersonRemoveIcon />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ContractCard;
