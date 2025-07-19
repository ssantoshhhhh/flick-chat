import { useOnboarding } from '../hooks/useOnboarding';
import { useEffect } from 'react';

export default function OnboardingChecklist({ projectId }) {
  const { checklists, fetchChecklists, fetchTasks, completeTask, loading, error } = useOnboarding();
  useEffect(() => { fetchChecklists(projectId); }, [projectId]);
  // Add UI for checklist/task display and completion
  return <div>{/* Onboarding checklist UI here */}</div>;
} 