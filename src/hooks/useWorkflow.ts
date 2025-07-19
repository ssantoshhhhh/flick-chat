import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export function useWorkflow() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a workflow
  const createWorkflow = useCallback(async (project_id: number, name: string, definition: any) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/workflow/create', { project_id, name, definition });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // List workflows for a project
  const fetchWorkflows = useCallback(async (projectId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/workflow/project/${projectId}`);
      setWorkflows(res.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Add a trigger to a workflow
  const addTrigger = useCallback(async (workflowId: number, trigger_type: string, trigger_value: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post(`/workflow/${workflowId}/trigger`, { trigger_type, trigger_value });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // List triggers for a workflow
  const fetchTriggers = useCallback(async (workflowId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/workflow/${workflowId}/triggers`);
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Manually trigger a workflow
  const triggerNow = useCallback(async (workflowId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post(`/workflow/${workflowId}/trigger-now`);
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Get workflow run history
  const fetchRuns = useCallback(async (workflowId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/workflow/${workflowId}/runs`);
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  return {
    workflows, loading, error,
    createWorkflow, fetchWorkflows,
    addTrigger, fetchTriggers,
    triggerNow, fetchRuns,
    setWorkflows
  };
} 