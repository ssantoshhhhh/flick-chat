import { useChat } from '../hooks/useChat';
import { useMedia } from '../hooks/useMedia';
import { useEffect, useState } from 'react';

export default function ChatWindow({ chatId }) {
  const { messages, fetchMessages, sendMessage, reactToMessage, pinItem, fetchThread, ...rest } = useChat();
  const { upload } = useMedia();
  const [input, setInput] = useState('');
  useEffect(() => { fetchMessages(chatId); }, [chatId]);
  // Add UI for messages, input, file upload, reactions, pinning, threads, etc.
  return (
    <div>
      <h2>Chat</h2>
      {/* Render messages, input, file upload, reactions, etc. */}
    </div>
  );
} 