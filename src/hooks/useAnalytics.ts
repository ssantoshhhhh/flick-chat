import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch latest analytics snapshot for a project
  const fetchAnalytics = useCallback(async (projectId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/analytics/project/${projectId}`);
      setAnalytics(res.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Fetch analytics history for a project
  const fetchHistory = useCallback(async (projectId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/analytics/project/${projectId}/history`);
      setHistory(res.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  return {
    analytics, history, loading, error,
    fetchAnalytics, fetchHistory,
    setAnalytics, setHistory
  };
} 