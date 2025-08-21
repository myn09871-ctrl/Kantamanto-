
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Phone, 
  Video,
  MoreVertical,
  ArrowLeft,
  Search,
  Check,
  CheckCheck,
  Clock,
  User,
  Package
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import VoiceRecorder from './VoiceRecorder';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

const VendorChatInterface = () => {
  const { user } = useAuth();
  const { 
    conversations, 
    messages, 
    activeConversation, 
    setActiveConversation,
    sendMessage,
    loading,
    sending
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    await sendMessage("🎵 Voice message", "voice");
    console.log('Voice message would be processed here');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

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

  const getDateLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const activeConv = conversations.find(c => c.id === activeConversation);

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, message) => {
    const date = getDateLabel(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex h-[700px] bg-background rounded-xl border shadow-lg overflow-hidden">
      {/* Customer Conversations List */}
      <div className={cn(
        "w-full md:w-80 border-r bg-card/50 glassmorphic-light flex flex-col",
        showMobileChat && "hidden md:flex"
      )}>
        {/* Header */}
        <div className="p-3 border-b">
          <h2 className="text-base font-semibold mb-3">Customer Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-xs bg-background/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                {searchTerm ? 'No conversations found' : 'No customer messages yet'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setActiveConversation(conversation.id);
                  setShowMobileChat(true);
                }}
                className={cn(
                  "p-3 border-b cursor-pointer hover:bg-muted/30 transition-all duration-200",
                  activeConversation === conversation.id && "bg-primary/10 border-r-4 border-r-primary"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10 ring-2 ring-background">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600 text-xs">
                      {conversation.customer?.full_name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-medium truncate">
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
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
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
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !showMobileChat && "hidden md:flex"
      )}>
        {activeConversation && activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b glassmorphic-light flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setShowMobileChat(false)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                
                <Avatar className="w-10 h-10 ring-2 ring-background">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600 text-xs">
                    {activeConv.customer?.full_name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="text-sm font-medium">
                    {activeConv.customer?.full_name || 'Customer'}
                  </h3>
                  {activeConv.product && (
                    <div className="flex items-center">
                      <Package className="w-3 h-3 text-primary/70 mr-1" />
                      <p className="text-xs text-primary/70">
                        {activeConv.product.name}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-green-600">● Online</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3">
              {Object.keys(groupedMessages).length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-base font-medium mb-2">Customer Support Chat</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This customer is interested in your products. Start a conversation to help them.
                    </p>
                  </div>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, dateMessages]: [string, any]) => (
                  <div key={date} className="mb-4">
                    <div className="chat-date-separator">
                      <span>{date}</span>
                    </div>
                    
                    {dateMessages.map((message: any) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex mb-3",
                          message.sender_id === user?.id ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "flex items-end space-x-2 max-w-[80%]",
                          message.sender_id === user?.id && "flex-row-reverse space-x-reverse"
                        )}>
                          {message.sender_id !== user?.id && (
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600">
                                {activeConv.customer?.full_name?.charAt(0) || 'C'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={cn(
                            "rounded-2xl px-3 py-2 max-w-full break-words glassmorphic-light",
                            message.sender_id === user?.id
                              ? "bg-primary/90 text-primary-foreground"
                              : "bg-background/80"
                          )}>
                            <p className="text-xs whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                            <div className={cn(
                              "flex items-center justify-between mt-1 text-xs",
                              message.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              <span>
                                {formatTime(message.created_at)}
                              </span>
                              {message.sender_id === user?.id && (
                                <div className="ml-2">
                                  {message.is_read ? (
                                    <CheckCheck className="w-3 h-3 text-blue-300" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t glassmorphic-light">
              <div className="flex items-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 rounded-full h-8 w-8 p-0"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <div className="flex-1 relative">
                  <Textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response..."
                    disabled={sending}
                    className="min-h-[36px] max-h-24 resize-none pr-16 rounded-2xl text-xs"
                    rows={1}
                  />
                  <div className="absolute right-2 top-2 flex items-center space-x-1">
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                          <Smile className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Picker
                          data={data}
                          onEmojiSelect={handleEmojiSelect}
                          theme="light"
                          previewPosition="none"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <VoiceRecorder 
                      onVoiceMessage={handleVoiceMessage}
                      disabled={sending}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                  className="rounded-full h-9 w-9 p-0 shrink-0 neumorphic"
                >
                  {sending ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center glassmorphic-light">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 neumorphic">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Vendor Chat Center</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Connect with your customers to answer questions about products and provide excellent service.
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-500 mr-2" />
                  Real-time customer support
                </p>
                <p className="flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-500 mr-2" />
                  Product-specific conversations
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorChatInterface;
