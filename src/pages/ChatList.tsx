import { useChat } from '../hooks/useChat';
import { useEffect } from 'react';

export default function ChatList({ onSelectChat }) {
  const { chats, fetchChats, loading, error } = useChat();
  useEffect(() => { fetchChats(); }, []);
  return (
    <div>
      <h2>Chats</h2>
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      <ul>
        {chats.map(chat => (
          <li key={chat.id} onClick={() => onSelectChat(chat.id)}>
            {chat.name || chat.type}
          </li>
        ))}
      </ul>
    </div>
  );
} 