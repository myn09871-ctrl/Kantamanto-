
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle, User, Play, Pause, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  conversation_id: string;
  message_type: string;
  sender?: {
    full_name: string;
  };
}

interface Conversation {
  id: string;
  vendor_id: string;
  customer_id: string;
  product_id: string | null;
  created_at: string;
  updated_at: string;
  vendor?: {
    shop_name: string;
    profile_picture_url: string;
  };
  customer?: {
    full_name: string;
  };
  product?: {
    name: string;
  };
}

const ChatInterface = () => {
  const { user } = useAuth();
  const { profile, vendor } = useProfile();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchConversations();
    subscribeToMessages();
  }, [user, vendor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          vendor:vendors(shop_name, profile_picture_url),
          customer:profiles(full_name),
          product:products(name)
        `);

      if (vendor) {
        query = query.eq('vendor_id', vendor.id);
      } else {
        query = query.eq('customer_id', user.id);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (selectedConversation === newMessage.conversation_id) {
            setMessages(prev => [...prev, newMessage]);
          }
          
          // Show notification if message is not from current user
          if (newMessage.sender_id !== user?.id) {
            // Update conversations to move this one to top
            fetchConversations();
            
            // Show toast notification
            toast({
              title: "New Message",
              description: newMessage.message_type === 'voice' ? "You received a voice message" : newMessage.content.substring(0, 50) + "...",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (content: string, messageType: string = 'text') => {
    if (!selectedConversation || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: content,
          message_type: messageType
        });

      if (error) throw error;

      if (messageType === 'text') {
        setNewMessage("");
      }

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await uploadAndSendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const uploadAndSendVoiceMessage = async (audioBlob: Blob) => {
    try {
      const fileName = `voice-message-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .upload(`voice-messages/${fileName}`, audioBlob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(data.path);

      await sendMessage(publicUrl, 'voice');
      toast({
        title: "Voice message sent",
        description: "Your voice message has been sent successfully"
      });
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Error",
        description: "Failed to send voice message",
        variant: "destructive"
      });
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchMessages(conversationId);
  };

  const playAudio = (messageId: string, audioUrl: string) => {
    if (playingAudio === messageId) {
      if (audioRefs.current[messageId]) {
        audioRefs.current[messageId].pause();
        audioRefs.current[messageId].currentTime = 0;
      }
      setPlayingAudio(null);
    } else {
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
        audioRefs.current[playingAudio].currentTime = 0;
      }

      if (!audioRefs.current[messageId]) {
        audioRefs.current[messageId] = new Audio(audioUrl);
        audioRefs.current[messageId].onended = () => setPlayingAudio(null);
      }
      
      audioRefs.current[messageId].play();
      setPlayingAudio(messageId);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading conversations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center dark:text-white">
            <MessageCircle className="w-5 h-5 mr-2" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No conversations yet</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation.id)}
                  className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedConversation === conversation.id ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage 
                        src={vendor ? conversation.customer?.full_name : conversation.vendor?.profile_picture_url} 
                      />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm dark:text-white">
                        {vendor ? conversation.customer?.full_name : conversation.vendor?.shop_name}
                      </p>
                      {conversation.product && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          About: {conversation.product.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="dark:text-white">
            {selectedConversation ? "Chat" : "Select a conversation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {selectedConversation ? (
            <>
              <div className="h-[350px] overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === user?.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      {message.message_type === 'voice' ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playAudio(message.id, message.content)}
                            className={`p-1 ${
                              message.sender_id === user?.id 
                                ? 'text-white hover:bg-orange-600' 
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {playingAudio === message.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <span className="text-sm">Voice message</span>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 border-t dark:border-gray-700 space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => sendMessage(newMessage)} 
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                  >
                    {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                    {isRecording ? 'Recording...' : 'Hold to Record'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[450px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
