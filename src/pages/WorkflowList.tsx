import { useWorkflow } from '../hooks/useWorkflow';
import { useEffect } from 'react';

export default function WorkflowList({ projectId, onSelectWorkflow }) {
  const { workflows, fetchWorkflows, loading, error } = useWorkflow();
  useEffect(() => { fetchWorkflows(projectId); }, [projectId]);
  return (
    <div>
      <h2>Workflows</h2>
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      <ul>
        {workflows.map(wf => (
          <li key={wf.id} onClick={() => onSelectWorkflow(wf.id)}>
            {wf.name}
          </li>
        ))}
      </ul>
    </div>
  );
} 