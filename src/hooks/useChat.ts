import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';

export function useChat() {
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List user's chats
  const fetchChats = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/chat/my');
      setChats(res.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Create a chat
  const createChat = useCallback(async (type: string, name: string, members: number[]) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/chat/create', { type, name, members });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Fetch messages for a chat
  const fetchMessages = useCallback(async (chatId: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/chat/${chatId}/messages`);
      setMessages(res.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Send a message (E2EE: encrypted_content)
  const sendMessage = useCallback(async (chatId: number, encrypted_content: string, type = 'text', parent_message_id?: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post(`/chat/${chatId}/message`, { encrypted_content, type, parent_message_id });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, []);

  // Pin/unpin a message
  const pinItem = useCallback(async (itemType: string, itemId: number) => {
    await api.post('/chat/pin', { itemType, itemId });
  }, []);
  const unpinItem = useCallback(async (itemType: string, itemId: number) => {
    await api.post('/chat/unpin', { itemType, itemId });
  }, []);

  // Add/remove reaction
  const reactToMessage = useCallback(async (messageId: number, emoji: string, chatId: number) => {
    await api.post(`/chat/message/${messageId}/react`, { emoji, chatId });
  }, []);
  const removeReaction = useCallback(async (messageId: number, emoji: string, chatId: number) => {
    await api.delete(`/chat/message/${messageId}/react`, { data: { emoji, chatId } });
  }, []);

  // Edit/delete message
  const editMessage = useCallback(async (messageId: number, content: string) => {
    await api.put(`/chat/message/${messageId}/edit`, { content });
  }, []);
  const deleteMessage = useCallback(async (messageId: number) => {
    await api.delete(`/chat/message/${messageId}`);
  }, []);

  // Thread: fetch replies
  const fetchThread = useCallback(async (messageId: number) => {
    const res = await api.get(`/chat/message/${messageId}/thread`);
    return res.data;
  }, []);

  // Real-time: connect/disconnect/join/leave
  const connectSocket = useCallback(() => { socket.connect(); }, []);
  const disconnectSocket = useCallback(() => { socket.disconnect(); }, []);
  const joinChat = useCallback((chatId: number) => { socket.emit('join', chatId); }, []);
  const leaveChat = useCallback((chatId: number) => { socket.emit('leave', chatId); }, []);

  return {
    chats, messages, loading, error,
    fetchChats, createChat,
    fetchMessages, sendMessage,
    pinItem, unpinItem,
    reactToMessage, removeReaction,
    editMessage, deleteMessage,
    fetchThread,
    connectSocket, disconnectSocket, joinChat, leaveChat,
    setMessages, setChats
  };
} 