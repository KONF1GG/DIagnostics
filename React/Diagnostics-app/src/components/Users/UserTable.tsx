import React from "react";
import { Link } from "react-router-dom";
import { User } from "../../API/users";

interface UserTableProps {
  users: User[];
}

const UserTable: React.FC<UserTableProps> = ({ users }) => {
  return (
    <table className="table">
      <thead className="table-primary">
        <tr>
          <th>логин</th>
          <th>ФИО</th>
          <th>Роль</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>
              <Link to={`/users/${user.id}`} className="user-link">
                {user.username}
              </Link>
            </td>
            <td>
              {user.lastname} {user.firstname} {user.middlename}
            </td>
            <td>{user.role === "admin" ? "Администратор" : "Пользователь"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserTable;
