import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export function useMedia() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload a file
  const upload = useCallback(async (file: File) => {
    setLoading(true); setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Delete a file
  const deleteFile = useCallback(async (filename: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.delete(`/media/delete/${filename}`);
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Get file URL
  const getFileUrl = (filename: string) => `/media/${filename}`;

  return { upload, deleteFile, getFileUrl, loading, error };
} 