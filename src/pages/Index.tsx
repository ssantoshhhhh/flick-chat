import AuthPage from "@/components/AuthPage";
import ChatLayout from "@/components/ChatLayout";
import { useAuth } from "../hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  return <ChatLayout />;
};

export default Index;
