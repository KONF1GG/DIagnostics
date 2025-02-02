import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../CSS/Users.css";
import "../CSS/Loading.css";
import InfoList from "./InfoList";
import Loader from "../Pages/Default/Loading";
import UsersList, { Action, ActionList, User } from "../../API/users";

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[] | undefined>([]);
  const [actionList, setActionList] = useState<Action[] | undefined>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingCount, setLoadingCount] = useState<number>(2); // Отслеживание загрузок
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await UsersList();
        if (typeof result === "string") {
          setError(result);
        } else {
          // Сортировка пользователей
          const sortedUsers = result.sort((a, b) => {
            // Сначала по роли
            if (a.role === "admin" && b.role !== "admin") return -1;
            if (a.role !== "admin" && b.role === "admin") return 1;
            return a.username.localeCompare(b.username);
          });
          setUsers(sortedUsers);
        }
      } catch (err) {
        setError("Неожиданная ошибка");
      } finally {
        setLoadingCount((prev) => prev - 1);
      }
    };

    const fetchActionList = async () => {
      try {
        const result = await ActionList();
        if (typeof result === "string") {
          setError(result);
        } else {
          setActionList(result);
        }
      } catch (err) {
        setError("Неожиданная ошибка");
      } finally {
        setLoadingCount((prev) => prev - 1); 
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
                  <th>логин</th>
                  <th>ФИО</th>
                  <th>Роль</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <Link to={`/users/${user.id}`} className="user-link">
                        {user.username}
                      </Link>
                    </td>
                    <td>
                      {user.lastname} {user.firstname} {user.middlename}
                    </td>
                    <td>
                      {user.role === "admin" ? "Администратор" : "Пользователь"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h1 className="text-center title md-5">Последние изменения</h1>
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
                {actionList?.map((action, index) => (
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
