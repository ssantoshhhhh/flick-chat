import { useWorkflow } from '../hooks/useWorkflow';

export default function WorkflowBuilder({ workflowId }) {
  const { fetchTriggers, addTrigger, triggerNow, fetchRuns, ...rest } = useWorkflow();
  // Add UI for workflow editing, triggers, and run history
  return <div>{/* Workflow builder UI here */}</div>;
} 