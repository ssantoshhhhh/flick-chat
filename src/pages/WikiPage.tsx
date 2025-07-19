import { useWiki } from '../hooks/useWiki';
import { useEffect, useState } from 'react';

export default function WikiPage({ pageId }) {
  const { fetchPage, updatePage, fetchVersions, revertPage, ...rest } = useWiki();
  const [content, setContent] = useState('');
  useEffect(() => {
    fetchPage(pageId).then(page => setContent(page.content));
  }, [pageId]);
  // Add markdown editor/viewer, version history, revert, etc.
  return <div>{/* Markdown editor/viewer here */}</div>;
} 