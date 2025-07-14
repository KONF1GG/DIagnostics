import React from "react";

interface StatusBadgeProps {
  status: string | boolean;
  successText?: string;
  errorText?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  successText = "Успех",
  errorText = "Ошибка",
}) => {
  if (typeof status === "boolean") {
    return status ? (
      <span className="badge bg-success">{successText}</span>
    ) : (
      <span className="badge bg-danger">{errorText}</span>
    );
  }
  return <span>{status}</span>;
};

export default StatusBadge;
