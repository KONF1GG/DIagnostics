import React, { useEffect, useState } from "react";
import UsersList, { Action, ActionList, User } from "../../API/users";
import { Link, useNavigate } from "react-router-dom";
import "../CSS/Users.css";
import "../CSS/Loading.css";
import InfoList from "./InfoList";
import Loader from "../Pages/Default/Loading";

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [actionList, setActionList] = useState<Action[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingCount, setLoadingCount] = useState<number>(2); // Отслеживание загрузок
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await UsersList();
        if (typeof result === "string") {
          setError(result);
          if (
            result.includes("Invalid token") ||
            result.includes("Unauthorized")
          ) {
            navigate("/login");
          }
        } else {
          setUsers(result);
        }
      } catch (err) {
        setError("An unexpected error occurred.");
      } finally {
        setLoadingCount((prev) => prev - 1); 
      }
    };

    const fetchActionList = async () => {
      try {
        const result = await ActionList();
        if (typeof result === "string") {
          setError(result);
          if (
            result.includes("Invalid token") ||
            result.includes("Unauthorized")
          ) {
            navigate("/login");
          }
        } else {
          setActionList(result);
        }
      } catch (err) {
        setError("An unexpected error occurred.");
      } finally {
        setLoadingCount((prev) => prev - 1); // Уменьшаем счетчик загрузок
      }
    };

    fetchUsers();
    fetchActionList();
  }, [navigate]);

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
    <InfoList>
      <div className="container">
        <h1 className="text-center title md-5">Список пользователей</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        {loadingCount > 0 ? (
          <Loader />
        ) : (
          <>
            <table className="table">
              <thead className="table-primary">
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Роль</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="user-row">
                    <td>{user.id}</td>
                    <td>
                      <Link to={`/users/${user.id}`} className="user-link">
                        {user.name}
                      </Link>
                    </td>
                    <td>{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h1 className="text-center title md-5">История изменений</h1>
            <table className="table">
              <thead className="table-secondary">
                <tr>
                  <th>Имя пользователя</th>
                  <th>Дата</th>
                  <th>Логин</th>
                  <th>Страница</th>
                  <th>Действие</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {actionList.map((action, index) => (
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
          </>
        )}
      </div>
    </InfoList>
  );
};

export default Users;
