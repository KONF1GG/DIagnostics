import { useState, useEffect, useCallback } from 'react';
import { RedisAddressModel, getRedisAddresses } from '../API/redisAddresses';
import { useDebounce } from './useDebounce';

export const useRedisAddressSearch = (query: string, enabled: boolean = true) => {
  const [results, setResults] = useState<RedisAddressModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !enabled || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getRedisAddresses(searchQuery);
      
      if (!response) {
        setResults([]);
        return;
      }
      
      if ('detail' in response) {
        // Это реальная ошибка сервера, показываем красное сообщение
        setError(response.detail);
        setResults([]);
        return;
      }
      
      // Нормальный ответ или 404 (пустой список)
      setResults(response.addresses);
    } catch (err) {
      setError('Сервис поиска недоступен');
      setResults([]);
      console.error('Error in useRedisAddressSearch:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    clearResults,
  };
};
