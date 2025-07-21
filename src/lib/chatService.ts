import { api } from './api';

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
  isGroup: boolean;
  participants?: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'media' | 'system';
  status: 'sent' | 'delivered' | 'read';
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
  type?: 'text' | 'media';
}

class ChatService {
  // Get all chats for the current user
  async getChats(): Promise<Chat[]> {
    try {
      const response = await api.get('/chat/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching chats:', error);
      // Return mock data for now
      return this.getMockChats();
    }
  }

  // Get messages for a specific chat
  async getMessages(chatId: string): Promise<Message[]> {
    try {
      const response = await api.get(`/chat/${chatId}/messages`);
      return response.data.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Return mock messages for now
      return this.getMockMessages(chatId);
    }
  }

  // Send a message
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      const response = await api.post('/chat/send', request);
      return {
        ...response.data,
        timestamp: new Date(response.data.timestamp)
      };
    } catch (error) {
      console.error('Error sending message:', error);
      // Return mock message for now
      return this.createMockMessage(request);
    }
  }

  // Create a new chat
  async createChat(participantIds: string[], name?: string): Promise<Chat> {
    try {
      const response = await api.post('/chat/create', { participantIds, name });
      return response.data;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  // Search for users to start a chat
  async searchUsers(query: string): Promise<any[]> {
    try {
      const response = await api.get(`/user/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Mark messages as read
  async markAsRead(chatId: string, messageIds: string[]): Promise<void> {
    try {
      await api.post(`/chat/${chatId}/read`, { messageIds });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Mock data for development
  private getMockChats(): Chat[] {
    return [
      {
        id: "1",
        name: "John Doe",
        lastMessage: "Hey! How are you doing?",
        timestamp: "2 min",
        unreadCount: 2,
        isOnline: true,
        isGroup: false,
        participants: ["1", "2"]
      },
      {
        id: "2",
        name: "Project Alpha Team",
        lastMessage: "Alice: The design is ready for review",
        timestamp: "1 hour",
        unreadCount: 0,
        isOnline: false,
        isGroup: true,
        participants: ["1", "3", "4", "5"]
      },
      {
        id: "3",
        name: "Sarah Wilson",
        lastMessage: "Thanks for the help!",
        timestamp: "3 hours",
        unreadCount: 1,
        isOnline: true,
        isGroup: false,
        participants: ["1", "6"]
      }
    ];
  }

  private getMockMessages(chatId: string): Message[] {
    const mockMessages: { [key: string]: Message[] } = {
      "1": [
        {
          id: "1",
          chatId: "1",
          senderId: "2",
          senderName: "John Doe",
          content: "Hey! How are you doing?",
          timestamp: new Date(Date.now() - 120000),
          type: "text",
          status: "read"
        },
        {
          id: "2",
          chatId: "1",
          senderId: "1",
          senderName: "You",
          content: "I'm doing great, thanks! How about you?",
          timestamp: new Date(Date.now() - 60000),
          type: "text",
          status: "read"
        }
      ],
      "2": [
        {
          id: "3",
          chatId: "2",
          senderId: "3",
          senderName: "Alice",
          content: "The design is ready for review",
          timestamp: new Date(Date.now() - 3600000),
          type: "text",
          status: "read"
        }
      ],
      "3": [
        {
          id: "4",
          chatId: "3",
          senderId: "6",
          senderName: "Sarah Wilson",
          content: "Thanks for the help!",
          timestamp: new Date(Date.now() - 10800000),
          type: "text",
          status: "delivered"
        }
      ]
    };

    return mockMessages[chatId] || [];
  }

  private createMockMessage(request: SendMessageRequest): Message {
    return {
      id: Date.now().toString(),
      chatId: request.chatId,
      senderId: "1",
      senderName: "You",
      content: request.content,
      timestamp: new Date(),
      type: request.type || "text",
      status: "sent"
    };
  }
}

export const chatService = new ChatService(); 