import { useAnalytics } from '../hooks/useAnalytics';
import { useEffect } from 'react';

export default function AnalyticsDashboard({ projectId }) {
  const { analytics, fetchAnalytics, history, fetchHistory, loading, error } = useAnalytics();
  useEffect(() => { fetchAnalytics(projectId); fetchHistory(projectId); }, [projectId]);
  // Add UI for analytics charts and history
  return <div>{/* Analytics dashboard UI here */}</div>;
} 