import { useState } from "react";
import { MessageCircle, Settings, Plus, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
  isGroup: boolean;
}

const mockChats: Chat[] = [
  {
    id: "1",
    name: "John Doe",
    lastMessage: "Hey! How are you doing?",
    timestamp: "2 min",
    unreadCount: 2,
    isOnline: true,
    isGroup: false
  },
  {
    id: "2",
    name: "Project Alpha Team",
    lastMessage: "Alice: The design is ready for review",
    timestamp: "1 hour",
    unreadCount: 0,
    isOnline: false,
    isGroup: true
  },
  {
    id: "3",
    name: "Sarah Wilson",
    lastMessage: "Thanks for the help!",
    timestamp: "3 hours",
    unreadCount: 1,
    isOnline: true,
    isGroup: false
  }
];

const ChatLayout = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = mockChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar - Chat List */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Flick</h1>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No chats yet</h3>
              <p className="text-muted-foreground mb-4">
                Start a conversation by searching for a username
              </p>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedChat === chat.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={chat.avatar} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {chat.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {chat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-chat-online border-2 border-card rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-foreground truncate">
                          {chat.name}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {chat.timestamp}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge className="ml-2 bg-primary text-primary-foreground">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">FLICK</span>
          </div>
          <Button size="sm" variant="ghost">
            <Settings className="h-5 w-5" />
          </Button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex items-center justify-center">
          {selectedChat ? (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Chat with {filteredChats.find(c => c.id === selectedChat)?.name}
              </h2>
              <p className="text-muted-foreground">
                Chat interface will be implemented here
              </p>
            </div>
          ) : (
            <div className="text-center space-y-6 max-w-md">
              <div className="relative">
                <h1 className="text-6xl font-bold text-primary animate-flick-glow">
                  FLICK
                </h1>
                <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-xl rounded-full transform scale-150"></div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  Welcome to Flick
                </h2>
                <p className="text-muted-foreground">
                  Select a chat to start messaging, or create a new conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;