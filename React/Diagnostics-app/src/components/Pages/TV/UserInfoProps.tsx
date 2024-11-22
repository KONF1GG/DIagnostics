import { useState } from "react";

interface UserInfoProps {
  login: string | null;
  password: string | null;
}

const UserInfo: React.FC<UserInfoProps> = ({ login, password }) => {
  const [isHovered, setIsHovered] = useState(false); // Состояние для отслеживания наведения

  // Функция для создания строки с звездочками
  const createStars = (password: string | null) => {
    return password ? '*'.repeat(password.length) : "Не указан";
  };

  return (
    <div className="text-start fs-4">
      <span>
        <strong>Логин:</strong> {login || "Не указан"}
      </span>
      <span className="ms-3">
        <strong>Пароль:</strong>
        <span 
          className="password-text"
          onMouseEnter={() => setIsHovered(true)} // При наведении показываем пароль
          onMouseLeave={() => setIsHovered(false)} // При уходе мыши возвращаем звездочки
        >
          {isHovered ? password || "Не указан" : createStars(password)}
        </span>
      </span>
    </div>
  );
};

export default UserInfo;
