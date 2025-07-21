import { useState } from "react";
import { MessageCircle, Settings, Plus, Search, MoreVertical, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ChatWindow from "./ChatWindow";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { Chat } from "../lib/chatService";





const ChatLayout = () => {
  const { logout } = useAuth();
  const { 
    chats, 
    selectedChat, 
    messages, 
    loading, 
    error, 
    selectChat, 
    sendMessage, 
    createChat, 
    searchUsers,
    setSelectedChat 
  } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const filteredChats = chats.filter(chat =>
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
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8"
              onClick={() => setShowNewChat(true)}
            >
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
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowNewChat(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedChat?.id === chat.id ? "bg-muted" : ""
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
          <div className="flex items-center space-x-2">

            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => {
                // Settings functionality coming soon
              }}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                logout();
                window.location.reload();
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1">
          {selectedChat ? (
            <ChatWindow 
              chatName={selectedChat.name}
              onBack={() => setSelectedChat(null)}
              messages={messages}
              onSendMessage={sendMessage}
              loading={loading}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
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
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Start New Chat</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Users</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username or email..."
                    value={userSearchQuery}
                    onChange={async (e) => {
                      const query = e.target.value;
                      setUserSearchQuery(query);
                      if (query.length > 2) {
                        const results = await searchUsers(query);
                        setSearchResults(results);
                      } else {
                        setSearchResults([]);
                      }
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={async () => {
                        try {
                          await createChat([user.id], user.username);
                          setShowNewChat(false);
                          setUserSearchQuery("");
                          setSearchResults([]);
                        } catch (error) {
                          console.error("Failed to create chat:", error);
                        }
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewChat(false);
                    setUserSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;