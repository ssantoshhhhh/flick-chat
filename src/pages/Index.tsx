import { useState } from "react";
import AuthPage from "@/components/AuthPage";
import ChatLayout from "@/components/ChatLayout";

const Index = () => {
  // In a real app, this would be managed by authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <ChatLayout />;
};

export default Index;
