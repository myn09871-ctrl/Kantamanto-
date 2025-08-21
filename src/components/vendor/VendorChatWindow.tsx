
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Phone, 
  Video,
  MoreVertical,
  Package,
  Check,
  CheckCheck,
  Play,
  Pause,
  Download
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

interface VendorChatWindowProps {
  conversationId: string;
}

const VendorChatWindow = ({ conversationId }: VendorChatWindowProps) => {
  const { user } = useAuth();
  const { 
    conversations, 
    messages, 
    sendMessage,
    sending,
    setActiveConversation
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    setActiveConversation(conversationId);
  }, [conversationId, setActiveConversation]);

  const conversation = conversations.find(c => c.id === conversationId);

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
    const success = await sendMessage(audioBlob, "voice");
    if (success) {
      console.log('Voice message sent successfully');
    }
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

  const playVoiceMessage = (messageId: string, audioContent: string) => {
    const currentAudio = audioRefs.current.get(messageId);
    
    if (currentAudio) {
      if (playingAudio === messageId) {
        currentAudio.pause();
        setPlayingAudio(null);
      } else {
        // Stop any other playing audio
        audioRefs.current.forEach((audio, id) => {
          if (id !== messageId) {
            audio.pause();
          }
        });
        
        currentAudio.play();
        setPlayingAudio(messageId);
      }
    } else {
      // Create new audio element
      const audio = new Audio(audioContent);
      audio.onended = () => setPlayingAudio(null);
      audio.onpause = () => setPlayingAudio(null);
      audioRefs.current.set(messageId, audio);
      
      audio.play();
      setPlayingAudio(messageId);
    }
  };

  const downloadVoiceMessage = (audioContent: string) => {
    const link = document.createElement('a');
    link.href = audioContent;
    link.download = `voice-message-${Date.now()}.webm`;
    link.click();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const groupedMessages = messages.reduce((groups: any, message) => {
    const date = getDateLabel(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const renderMessage = (message: any) => {
    if (message.message_type === 'voice') {
      return (
        <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg max-w-[200px]">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => playVoiceMessage(message.id, message.content)}
          >
            {playingAudio === message.id ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <div className="flex-1 text-xs text-muted-foreground">
            Voice message
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => downloadVoiceMessage(message.content)}
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    return (
      <p className="text-sm whitespace-pre-wrap">
        {message.content}
      </p>
    );
  };

  if (!conversation) {
    return (
      <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md border shadow-lg">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-md border shadow-lg">
      {/* Chat Header */}
      <div className="p-3 border-b bg-gradient-to-r from-background/50 to-muted/20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600 text-xs">
              {conversation.customer?.full_name?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="text-sm font-medium">
              {conversation.customer?.full_name || 'Customer'}
            </h3>
            {conversation.product && (
              <div className="flex items-center">
                <Package className="w-3 h-3 text-primary/70 mr-1" />
                <p className="text-xs text-primary/70">
                  Discussing: {conversation.product.name}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-accent">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-accent">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-accent">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-b from-background/50 to-muted/10">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4 rounded-lg bg-card/50 backdrop-blur-sm">
              <h3 className="text-sm font-medium mb-2">Start the conversation</h3>
              <p className="text-xs text-muted-foreground">
                This customer is interested in your products. Send them a message!
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]: [string, any]) => (
            <div key={date} className="mb-4">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-muted/60 px-2 py-1 rounded-full">
                  <span className="text-xs font-medium text-muted-foreground">{date}</span>
                </div>
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
                          {conversation.customer?.full_name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      "rounded-2xl px-3 py-2 max-w-full break-words shadow-sm backdrop-blur-sm",
                      message.sender_id === user?.id
                        ? "bg-primary/90 text-primary-foreground"
                        : "bg-card/80 border"
                    )}>
                      {renderMessage(message)}
                      <div className={cn(
                        "flex items-center justify-between mt-1 text-xs",
                        message.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        <span>{formatTime(message.created_at)}</span>
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
      <div className="p-3 border-t">
        <div className="flex items-end space-x-2">
          <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0 rounded-full hover:bg-accent">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="min-h-[36px] max-h-24 resize-none pr-16 rounded-xl text-sm bg-background/50"
              rows={1}
            />
            <div className="absolute right-2 top-2 flex items-center space-x-1">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-accent">
                    <Smile className="w-3 h-3" />
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
            className="shrink-0 h-8 w-8 p-0 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VendorChatWindow;
