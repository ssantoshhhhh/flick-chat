import { useWiki } from '../hooks/useWiki';
import { useEffect } from 'react';

export default function WikiList({ projectId, onSelectPage }) {
  const { pages, fetchPages, loading, error } = useWiki();
  useEffect(() => { fetchPages(projectId); }, [projectId]);
  return (
    <div>
      <h2>Wiki Pages</h2>
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      <ul>
        {pages.map(page => (
          <li key={page.id} onClick={() => onSelectPage(page.id)}>
            {page.title}
          </li>
        ))}
      </ul>
    </div>
  );
} 