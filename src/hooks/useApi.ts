import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (method: string, url: string, data?: any, config?: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.request({ method, url, data, ...config });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  return { request, loading, error };
} 