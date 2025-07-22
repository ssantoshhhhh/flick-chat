import { useState, useEffect, useCallback } from 'react';
import { chatService, Chat, Message, SendMessageRequest } from '../lib/chatService';
import { socket } from '../lib/socket';

// Exported helper to (re)connect socket with correct userId
export function connectSocketWithUserId() {
  const userId = localStorage.getItem('userId');
  if (userId) {
    socket.io.opts.query = { userId };
    if (!socket.connected) socket.connect();
  }
}

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load chats
  const loadChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chatList = await chatService.getChats();
      setChats(chatList);
    } catch (err: any) {
      setError(err.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for a chat
  const loadMessages = useCallback(async (chatId: string) => {
    setLoading(true);
    setError(null);
    try {
      const messageList = await chatService.getMessages(chatId);
      setMessages(messageList);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Select a chat
  const selectChat = useCallback(async (chat: Chat) => {
    setSelectedChat(chat);
    localStorage.setItem('selectedChatId', chat.id);
    await loadMessages(chat.id);
  }, [loadMessages]);

  // On mount, restore selected chat from localStorage if possible
  useEffect(() => {
    if (chats.length === 0) return;
    const lastChatId = localStorage.getItem('selectedChatId');
    if (lastChatId) {
      const lastChat = chats.find(chat => chat && chat.id && String(chat.id) === String(lastChatId));
      if (lastChat) {
        selectChat(lastChat);
      }
    }
  }, [chats, selectChat]);

  // Real-time: Join chat room and listen for new messages
  useEffect(() => {
    if (!selectedChat) return;
    socket.connect();
    socket.emit('join', selectedChat.id);
    const handleMessage = (data: any) => {
      if (data.chatId === selectedChat.id) {
        setMessages(prev => [...prev, {
          ...data,
          timestamp: new Date(data.timestamp)
        }]);
      }
    };
    socket.on('message', handleMessage);
    return () => {
      socket.emit('leave', selectedChat.id);
      socket.off('message', handleMessage);
    };
  }, [selectedChat]);

  // Call this after login in your app (or expose it from useAuth)
  // connectSocketWithUserId();

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!selectedChat || !content.trim()) return;
    const senderId = localStorage.getItem('userId');
    if (!senderId) {
      alert('User not logged in!');
      return;
    }
    const request: SendMessageRequest = {
      chatId: selectedChat.id,
      content: content.trim(),
      type: 'text'
    };
    try {
      // Emit via socket for real-time (only if senderId is present)
      socket.emit('message', {
        chatId: selectedChat.id,
        content: content.trim(),
        type: 'text',
        senderId,
        timestamp: new Date().toISOString()
      });
      // Also send via API for persistence
      const newMessage = await chatService.sendMessage(request);
      setMessages(prev => [...prev, newMessage]);
      // Update the chat's last message
      setChats(prev => prev.map(chat =>
        chat.id === selectedChat.id
          ? { ...chat, lastMessage: content, timestamp: 'now', unreadCount: 0 }
          : chat
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  }, [selectedChat]);

  // Create a new chat
  const createChat = useCallback(async (participantIds: string[], name?: string) => {
    try {
      const newChat = await chatService.createChat(participantIds, name);
      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (err: any) {
      setError(err.message || 'Failed to create chat');
      throw err;
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    try {
      return await chatService.searchUsers(query);
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
      return [];
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!selectedChat) return;
    try {
      await chatService.markAsRead(selectedChat.id, messageIds);
      setMessages(prev => prev.map(msg =>
        messageIds.includes(msg.id)
          ? { ...msg, status: 'read' as const }
          : msg
      ));
    } catch (err: any) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [selectedChat]);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return {
    chats,
    selectedChat,
    messages,
    loading,
    error,
    loadChats,
    selectChat,
    sendMessage,
    createChat,
    searchUsers,
    markAsRead,
    setSelectedChat
  };
} 