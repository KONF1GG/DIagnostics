import React, { useEffect, useState } from "react";
import UsersList from "../../API/users";
import { Link, useNavigate } from "react-router-dom";
import "../CSS/Users.css";
import "../CSS/Loading.css";
import "../CSS/Users.css";
import InfoList from "./InfoList";
import Loader from "../Pages/Default/Loading";

interface User {
  id: number;
  name: string;
  role: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  return (
    <InfoList>
      <div className="container">
        <h1 className="text-center title md-5">Список пользователей</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        {loading ? (
          <Loader />
        ) : (
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
        )}
      </div>
    </InfoList>
  );
};

export default Users;
