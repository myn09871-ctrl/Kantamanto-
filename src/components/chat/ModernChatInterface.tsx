
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Calendar,
  ChevronDown
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import VoiceRecorder from './VoiceRecorder';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

const ModernChatInterface = () => {
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
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
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
    // This would integrate with the existing sendMessage function
    // For now, we'll convert it to a placeholder
    await sendMessage("🎵 Voice message", "voice");
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

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = (conv.vendor?.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     conv.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     conv.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (selectedDateFilter === 'all') return matchesSearch;
    
    const today = new Date();
    const convDate = new Date(conv.last_message_time || conv.updated_at);
    
    switch (selectedDateFilter) {
      case 'today':
        return matchesSearch && convDate.toDateString() === today.toDateString();
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return matchesSearch && convDate.toDateString() === yesterday.toDateString();
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return matchesSearch && convDate >= weekAgo;
      default:
        return matchesSearch;
    }
  });

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
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getDateLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const getConversationName = (conv: any) => {
    const isCustomer = conv.customer_id === user?.id;
    return isCustomer ? conv.vendor?.shop_name : conv.customer?.full_name;
  };

  const getConversationAvatar = (conv: any) => {
    const isCustomer = conv.customer_id === user?.id;
    return isCustomer ? conv.vendor?.profile_picture_url : null;
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
      {/* Conversations List */}
      <div className={cn(
        "w-full md:w-80 border-r bg-card flex flex-col",
        showMobileChat && "hidden md:flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Messages</h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-1">
                  {[
                    { value: 'all', label: 'All messages' },
                    { value: 'today', label: 'Today' },
                    { value: 'yesterday', label: 'Yesterday' },
                    { value: 'week', label: 'This week' },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedDateFilter === option.value ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setSelectedDateFilter(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
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
                  "p-4 border-b cursor-pointer hover:bg-muted/30 transition-all duration-200 hover:scale-[1.02]",
                  activeConversation === conversation.id && "bg-primary/10 border-r-4 border-r-primary shadow-sm"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12 ring-2 ring-background shadow-sm">
                      <AvatarImage src={getConversationAvatar(conversation)} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                        {getConversationName(conversation)?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background shadow-sm"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate text-sm">
                        {getConversationName(conversation)}
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {formatTime(conversation.last_message_time || conversation.updated_at)}
                      </span>
                    </div>
                    
                    {conversation.product && (
                      <p className="text-xs text-primary/70 truncate mb-1 font-medium">
                        📦 {conversation.product.name}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                        {conversation.last_message || 'Start conversation...'}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 min-w-[20px] rounded-full flex items-center justify-center">
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
            <div className="p-4 border-b bg-gradient-to-r from-background to-muted/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setShowMobileChat(false)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                
                <div className="relative">
                  <Avatar className="w-12 h-12 ring-2 ring-background shadow-sm">
                    <AvatarImage src={getConversationAvatar(activeConv)} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                      {getConversationName(activeConv)?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm">
                    {getConversationName(activeConv)}
                  </h3>
                  {activeConv.product && (
                    <p className="text-xs text-primary/70 font-medium">
                      📦 {activeConv.product.name}
                    </p>
                  )}
                  <p className="text-xs text-green-600 font-medium">● Online</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="rounded-full">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-background/50 to-muted/10">
              {Object.keys(groupedMessages).length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Send a message to begin chatting with {getConversationName(activeConv)}. 
                      You can send text, voice messages, images, and files.
                    </p>
                  </div>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, dateMessages]: [string, any]) => (
                  <div key={date} className="mb-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-muted/60 px-3 py-1 rounded-full">
                        <span className="text-xs font-medium text-muted-foreground">{date}</span>
                      </div>
                    </div>
                    
                    {dateMessages.map((message: any) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex mb-4",
                          message.sender_id === user?.id ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "flex items-end space-x-2 max-w-[85%] group",
                          message.sender_id === user?.id && "flex-row-reverse space-x-reverse"
                        )}>
                          {message.sender_id !== user?.id && (
                            <Avatar className="w-8 h-8 ring-1 ring-background shadow-sm">
                              <AvatarImage src={getConversationAvatar(activeConv)} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10">
                                {getConversationName(activeConv)?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={cn(
                            "rounded-2xl px-4 py-2 max-w-full break-words shadow-sm transition-all duration-200 group-hover:shadow-md",
                            message.sender_id === user?.id
                              ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
                              : "bg-background border border-border/50"
                          )}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                            <div className={cn(
                              "flex items-center justify-between mt-2 text-xs",
                              message.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              <span className="font-medium">
                                {formatTime(message.created_at)}
                              </span>
                              {message.sender_id === user?.id && (
                                <div className="text-xs ml-2">
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
            <div className="p-4 border-t bg-gradient-to-r from-background to-muted/10">
              <div className="flex items-end space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 rounded-full p-2"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <Textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="min-h-[44px] max-h-32 resize-none pr-20 rounded-2xl border-2 focus:border-primary/50 transition-colors"
                    rows={1}
                  />
                  <div className="absolute right-3 top-2 flex items-center space-x-1">
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10">
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
                  className="rounded-full w-12 h-12 p-0 shrink-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {sending ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-muted/5 to-muted/10">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Send className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Welcome to Kantamanto Chat
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Connect with vendors and customers to negotiate prices, ask questions about products, 
                and coordinate orders seamlessly.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Real-time messaging
                </p>
                <p className="flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Voice messages & file sharing
                </p>
                <p className="flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Product discussions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernChatInterface;
