import { useWhiteboard } from '../hooks/useWhiteboard';
import { useEffect } from 'react';

export default function WhiteboardList({ projectId, onSelectWhiteboard }) {
  const { whiteboards, fetchWhiteboards, loading, error } = useWhiteboard();
  useEffect(() => { fetchWhiteboards(projectId); }, [projectId]);
  return (
    <div>
      <h2>Whiteboards</h2>
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      <ul>
        {whiteboards.map(wb => (
          <li key={wb.id} onClick={() => onSelectWhiteboard(wb.id)}>
            {wb.name}
          </li>
        ))}
      </ul>
    </div>
  );
} 