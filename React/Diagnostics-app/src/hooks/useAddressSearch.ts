import { useState, useEffect, useCallback } from 'react';
import { AddressResult, searchAddresses } from '../API/addressSearch';
import { useDebounce } from './useDebounce';

export const useAddressSearch = (query: string, enabled: boolean = true) => {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !enabled) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await searchAddresses(searchQuery);
      setResults(response.results);
    } catch (err) {
      setError('Ошибка при поиске адресов');
      setResults([]);
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