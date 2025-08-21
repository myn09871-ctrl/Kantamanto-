
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Send, 
  User, 
  Paperclip, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Smile,
  Phone,
  VideoIcon,
  MoreVertical,
  Check,
  CheckCheck,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import VoiceRecorder from "./VoiceRecorder";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ChatDialogProps {
  vendorId: string;
  vendorName: string;
  vendorImage?: string;
  productId?: string;
  productName?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type: string;
  is_read: boolean;
  sender?: {
    full_name: string;
  };
}

const ChatDialog = ({ vendorId, vendorName, vendorImage, productId, productName }: ChatDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id !== user.id) {
            setMessages(prev => [...prev, newMessage]);
            // Mark as read immediately
            markAsRead(newMessage.id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, user]);

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
  };

  const initializeConversation = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Check if conversation already exists
      let { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('customer_id', user.id)
        .eq('product_id', productId || null)
        .maybeSingle();

      let convId;
      
      if (existingConversation) {
        convId = existingConversation.id;
      } else {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert({
            vendor_id: vendorId,
            customer_id: user.id,
            product_id: productId || null
          })
          .select('id')
          .single();

        if (error) throw error;
        convId = newConversation.id;
      }

      setConversationId(convId);
      await fetchMessages(convId);
      
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(full_name)
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', user?.id);

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (content: string, messageType: string = 'text') => {
    if (!conversationId || !user || !content.trim()) return;

    try {
      setSending(true);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
          is_read: false
        })
        .select('*')
        .single();

      if (error) throw error;

      // Add message optimistically
      const messageWithSender = {
        ...data,
        sender: { full_name: user.email || 'You' }
      };
      setMessages(prev => [...prev, messageWithSender]);

      setNewMessage("");

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    await sendMessage(newMessage);
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    try {
      const fileName = `voice-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .upload(`voice-messages/${fileName}`, audioBlob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(data.path);

      await sendMessage(publicUrl, 'voice');
    } catch (error) {
      console.error('Error uploading voice message:', error);
      toast({
        title: "Error",
        description: "Failed to send voice message",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .upload(`chat-files/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(data.path);

      const messageType = file.type.startsWith('image/') ? 'image' : 
                         file.type.startsWith('video/') ? 'video' : 'file';

      await sendMessage(publicUrl, messageType);
      
      toast({
        title: "File sent",
        description: "Your file has been sent successfully"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.sender_id !== user?.id) return null;
    
    if (message.is_read) {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    } else {
      return <Check className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.sender_id === user?.id;
    
    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-end space-x-2 max-w-[80%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {!isOwn && (
            <Avatar className="w-8 h-8">
              <AvatarImage src={vendorImage} />
              <AvatarFallback className="bg-primary/10 text-xs">
                {vendorName?.charAt(0) || 'V'}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className={`rounded-2xl px-4 py-2 max-w-full ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-background border shadow-sm'
          }`}>
            {message.message_type === 'image' ? (
              <img 
                src={message.content} 
                alt="Shared image" 
                className="max-w-64 h-auto rounded-lg cursor-pointer" 
                onClick={() => window.open(message.content, '_blank')}
              />
            ) : message.message_type === 'video' ? (
              <video 
                src={message.content} 
                controls 
                className="max-w-64 h-auto rounded-lg"
              />
            ) : message.message_type === 'voice' ? (
              <div className="flex items-center space-x-2">
                <audio controls className="max-w-48">
                  <source src={message.content} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : message.message_type === 'file' ? (
              <a 
                href={message.content} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center space-x-2 hover:underline"
              >
                <FileText className="w-4 h-4" />
                <span>Download File</span>
              </a>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}
            
            <div className={`flex items-center justify-between mt-1 text-xs ${
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}>
              <span>{formatTime(message.created_at)}</span>
              {getMessageStatusIcon(message)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (isOpen && user) {
      initializeConversation();
    }
  }, [isOpen, user, vendorId, productId]);

  if (!user) {
    return (
      <Button 
        variant="outline"
        className="w-full"
        onClick={() => toast({
          title: "Login Required",
          description: "Please login to start a conversation",
          variant: "destructive"
        })}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Chat with Vendor
      </Button>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline"
            className="w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with Vendor
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl h-[700px] flex flex-col p-0">
          {/* Chat Header */}
          <DialogHeader className="p-4 border-b bg-card">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={vendorImage} />
                    <AvatarFallback className="bg-primary/10">
                      {vendorName?.charAt(0) || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  {onlineStatus && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium text-sm">{vendorName}</h3>
                  {productName && (
                    <p className="text-xs text-muted-foreground">About: {productName}</p>
                  )}
                  <p className="text-xs text-green-600">{onlineStatus ? 'Online' : 'Last seen recently'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <VideoIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading conversation...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-background/50 to-muted/20">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-medium mb-2">Start your conversation</h3>
                      <p className="text-sm text-muted-foreground">
                        Send a message to {vendorName} to start discussing
                        {productName && ` about ${productName}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    {isTyping && (
                      <div className="flex justify-start mb-4">
                        <div className="bg-muted rounded-2xl px-4 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-card">
                <div className="flex items-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="min-h-[40px] max-h-32 resize-none pr-20 rounded-2xl"
                      rows={1}
                    />
                    <div className="absolute right-2 top-2 flex items-center space-x-1">
                      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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
                    className="rounded-full w-10 h-10 p-0 shrink-0"
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
          )}
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (file.size > 10 * 1024 * 1024) {
              toast({
                title: "File too large",
                description: "Please select a file smaller than 10MB",
                variant: "destructive"
              });
              return;
            }
            handleFileUpload(file);
          }
        }}
      />
    </>
  );
};

export default ChatDialog;
