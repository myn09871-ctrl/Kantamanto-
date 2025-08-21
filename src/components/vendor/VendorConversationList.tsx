
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Package, MessageCircle } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

interface VendorConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
}

const VendorConversationList = ({ onSelectConversation, selectedConversationId }: VendorConversationListProps) => {
  const { conversations, loading } = useChat();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <Card className="h-full p-4 bg-card/80 backdrop-blur-md border shadow-lg">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-md border shadow-lg">
      <div className="p-3 border-b">
        <h2 className="text-sm font-medium mb-3">Customer Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm bg-background/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-medium mb-1">No customer messages</h3>
              <p className="text-xs text-muted-foreground">
                {searchTerm ? 'No conversations match your search' : 'When customers message you, they\'ll appear here'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-all duration-200",
                  selectedConversationId === conversation.id && "bg-primary/10 border border-primary/20 shadow-md"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600 text-xs">
                      {conversation.customer?.full_name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium truncate">
                        {conversation.customer?.full_name || 'Customer'}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.last_message_time || conversation.updated_at)}
                      </span>
                    </div>
                    
                    {conversation.product && (
                      <div className="flex items-center mb-1">
                        <Package className="w-3 h-3 text-primary/70 mr-1" />
                        <p className="text-xs text-primary/70 truncate">
                          {conversation.product.name}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {conversation.last_message || 'Start conversation...'}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs h-4 min-w-[16px] rounded-full">
                          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
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
    </Card>
  );
};

export default VendorConversationList;
