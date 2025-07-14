import React from "react";
import { Action } from "../../API/users";

interface ActionTableProps {
  actions: Action[];
}

const ActionTable: React.FC<ActionTableProps> = ({ actions }) => {
  const renderStatus = (status: string | boolean) => {
    if (typeof status === "boolean") {
      return status ? (
        <span className="badge bg-success">Успех</span>
      ) : (
        <span className="badge bg-danger">Ошибка</span>
      );
    }
    return <span>{status}</span>;
  };

  return (
    <table className="table">
      <thead className="table-secondary">
        <tr>
          <th>Пользователь</th>
          <th>Дата</th>
          <th>Логин</th>
          <th>Страница</th>
          <th>Действие</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        {actions.map((action, index) => (
          <tr key={index}>
            <td>{action.name}</td>
            <td>{new Date(action.date).toLocaleString()}</td>
            <td>{action.login}</td>
            <td>{action.page}</td>
            <td>{action.action}</td>
            <td>{renderStatus(action.status)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ActionTable;
