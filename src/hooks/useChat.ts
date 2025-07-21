import { useState, useEffect, useCallback } from 'react';
import { chatService, Chat, Message, SendMessageRequest } from '../lib/chatService';

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
    await loadMessages(chat.id);
  }, [loadMessages]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!selectedChat || !content.trim()) return;

    const request: SendMessageRequest = {
      chatId: selectedChat.id,
      content: content.trim(),
      type: 'text'
    };

    try {
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