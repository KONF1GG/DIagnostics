import { useState, useEffect } from 'react';
import { GetApp, ResponseData } from '../API/App';
import { useAsyncOperation } from './useAsyncOperation';

export const useAppData = (login: string) => {
  const [data, setData] = useState<ResponseData | null>(null);
  const { loading, error, execute } = useAsyncOperation<ResponseData>();

  const fetchData = async () => {
    if (!login) return;

    await execute(async () => {
      const result = await GetApp(login);
      if (result && "detail" in result) {
        throw new Error(result.detail);
      }
      if (result) {
        setData(result);
        return result;
      }
      throw new Error("Ошибка: данные не получены");
    });
  };

  useEffect(() => {
    fetchData();
  }, [login]);

  return {
    data,
    setData,
    loading,
    error,
    refetch: fetchData
  };
};
