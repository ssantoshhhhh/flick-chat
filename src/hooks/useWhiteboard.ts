import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';

export function useWhiteboard() {
  const [whiteboards, setWhiteboards] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a whiteboard session
  const createWhiteboard = useCallback(async (project_id: number, name: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/whiteboard/create', { project_id, name });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // List whiteboards for a project
  const fetchWhiteboards = useCallback(async (projectId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/whiteboard/project/${projectId}`);
      setWhiteboards(res.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Save a whiteboard snapshot
  const saveSnapshot = useCallback(async (whiteboardId: number, snapshot_data: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post(`/whiteboard/${whiteboardId}/snapshot`, { snapshot_data });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Get all snapshots for a whiteboard
  const fetchSnapshots = useCallback(async (whiteboardId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/whiteboard/${whiteboardId}/snapshots`);
      setSnapshots(res.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Real-time: join/leave whiteboard room, emit/receive drawing events
  const joinWhiteboard = useCallback((whiteboardId: number) => {
    socket.emit('join', `whiteboard_${whiteboardId}`);
  }, []);
  const leaveWhiteboard = useCallback((whiteboardId: number) => {
    socket.emit('leave', `whiteboard_${whiteboardId}`);
  }, []);
  const emitDraw = useCallback((whiteboardId: number, data: any) => {
    socket.emit('whiteboard:draw', { whiteboardId, data });
  }, []);
  // Listen for 'whiteboard:draw' in your component with socket.on

  return {
    whiteboards, snapshots, loading, error,
    createWhiteboard, fetchWhiteboards,
    saveSnapshot, fetchSnapshots,
    joinWhiteboard, leaveWhiteboard, emitDraw,
    setWhiteboards, setSnapshots
  };
} 