import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export function useOnboarding() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create onboarding checklist
  const createChecklist = useCallback(async (project_id: number, name: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/onboarding/checklist', { project_id, name });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Add task to checklist
  const addTask = useCallback(async (checklist_id: number, description: string, assigned_to: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/onboarding/task', { checklist_id, description, assigned_to });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // List checklists for a project
  const fetchChecklists = useCallback(async (projectId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/onboarding/project/${projectId}`);
      setChecklists(res.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // List tasks for a checklist
  const fetchTasks = useCallback(async (checklistId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/onboarding/checklist/${checklistId}/tasks`);
      setTasks(res.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Mark onboarding task as complete
  const completeTask = useCallback(async (taskId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post(`/onboarding/task/${taskId}/complete`);
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  return {
    checklists, tasks, loading, error,
    createChecklist, addTask,
    fetchChecklists, fetchTasks,
    completeTask,
    setChecklists, setTasks
  };
} 