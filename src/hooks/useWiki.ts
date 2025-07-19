import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export function useWiki() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a wiki page
  const createPage = useCallback(async (project_id: number, title: string, content: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/wiki/create', { project_id, title, content });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // List wiki pages for a project
  const fetchPages = useCallback(async (projectId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/wiki/project/${projectId}`);
      setPages(res.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Get a single wiki page
  const fetchPage = useCallback(async (pageId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/wiki/${pageId}`);
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Update a wiki page
  const updatePage = useCallback(async (pageId: number, content: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.put(`/wiki/${pageId}`, { content });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Get version history for a wiki page
  const fetchVersions = useCallback(async (pageId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/wiki/${pageId}/versions`);
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Revert to a previous version
  const revertPage = useCallback(async (pageId: number, versionId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post(`/wiki/${pageId}/revert`, { versionId });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Delete a wiki page
  const deletePage = useCallback(async (pageId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.delete(`/wiki/${pageId}`);
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  return {
    pages, loading, error,
    createPage, fetchPages, fetchPage,
    updatePage, fetchVersions, revertPage, deletePage,
    setPages
  };
} 