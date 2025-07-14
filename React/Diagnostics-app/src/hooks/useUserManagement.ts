import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChangeUserData, DeleteUser, User, UserData } from '../../API/users';
import { showSuccessToast, showErrorToast, logUserAction } from '../../utils/apiHelpers';

export const useUserManagement = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setError("User ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await UserData(userId);

      if (typeof result === "string") {
        setError(result);
      } else if (result) {
        setUser(result);
        setFormData(result);
      }
    } catch (err) {
      setError("Произошла ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateUser = useCallback(async (changes: Partial<User>) => {
    if (!userId || !user) return false;

    try {
      const result = await ChangeUserData(userId, changes);
      if (typeof result === "string") {
        throw new Error(result);
      }

      await fetchUser();
      showSuccessToast("Данные успешно обновлены");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ошибка при обновлении данных";
      showErrorToast(errorMessage);
      return false;
    }
  }, [userId, user, fetchUser]);

  const deleteUser = useCallback(async () => {
    if (!userId) return false;

    try {
      const response = await DeleteUser(userId);
      if (typeof response === "string") {
        throw new Error(response);
      }

      await logUserAction({
        login: user?.username || '',
        page: 'Пользователи',
        action: 'Удаление пользователя',
        success: true,
        message: 'Пользователь успешно удален'
      });

      showSuccessToast("Пользователь успешно удалён");
      navigate("/users");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Произошла ошибка при удалении";
      showErrorToast(errorMessage);
      return false;
    }
  }, [userId, user, navigate]);

  const changePassword = useCallback(async (newPassword: string) => {
    if (!userId) return false;

    try {
      const result = await ChangeUserData(userId, { password: newPassword });
      if (typeof result === "string") {
        throw new Error(result);
      }
      
      showSuccessToast("Пароль успешно изменен");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ошибка при смене пароля";
      showErrorToast(errorMessage);
      return false;
    }
  }, [userId]);

  return {
    user,
    formData,
    setFormData,
    loading,
    error,
    fetchUser,
    updateUser,
    deleteUser,
    changePassword
  };
};
