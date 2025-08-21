
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ModernChatInterface from "@/components/chat/ModernChatInterface";

const Chat = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-muted-foreground">
            Chat with vendors and customers about products and orders
          </p>
        </div>
        
        <ModernChatInterface />
      </div>
    </div>
  );
};

export default Chat;
