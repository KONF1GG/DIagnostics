import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UsersList, { Action, ActionList, User } from '../../API/users';
import { useAsyncOperation } from './useAsyncOperation';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loadingCount, setLoadingCount] = useState(2);
  const navigate = useNavigate();
  
  const { error, loading } = useAsyncOperation<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResult, actionsResult] = await Promise.all([
          UsersList(),
          ActionList()
        ]);

        if (typeof usersResult === 'string') {
          throw new Error(usersResult);
        } else {
          const sortedUsers = usersResult.sort((a, b) => {
            if (a.role === "admin" && b.role !== "admin") return -1;
            if (a.role !== "admin" && b.role === "admin") return 1;
            return a.username.localeCompare(b.username);
          });
          setUsers(sortedUsers);
        }

        if (typeof actionsResult === 'string') {
          throw new Error(actionsResult);
        } else {
          setActions(actionsResult);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoadingCount(0);
      }
    };

    fetchData();
  }, [navigate]);

  return {
    users,
    actions,
    loading: loadingCount > 0,
    error
  };
};
