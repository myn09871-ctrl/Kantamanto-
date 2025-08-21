
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender?: {
    full_name: string;
  };
};

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
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
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
};

export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<any>(null);

  // Fetch conversations for vendor or customer
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching conversations for user:', user.id);
      
      // Check if user is a vendor
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      let query = supabase
        .from('conversations')
        .select(`
          *,
          vendor:vendors(shop_name, profile_picture_url),
          customer:profiles(full_name),
          product:products(name)
        `);

      if (vendorData?.status === 'approved') {
        query = query.eq('vendor_id', vendorData.id);
        console.log('Fetching conversations for vendor:', vendorData.id);
      } else {
        query = query.eq('customer_id', user.id);
        console.log('Fetching conversations for customer:', user.id);
      }

      const { data: convData, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      console.log('Raw conversations data:', convData);

      // Process conversations to get last message and unread count
      const enhancedConversations = await Promise.all(
        (convData || []).map(async (conv) => {
          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, message_type, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count (messages not sent by current user and not read)
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .eq('is_read', false);

          let lastMessageText = 'Start conversation...';
          if (lastMsg) {
            switch (lastMsg.message_type) {
              case 'voice':
                lastMessageText = '🎵 Voice message';
                break;
              case 'image':
                lastMessageText = '📷 Image';
                break;
              case 'file':
                lastMessageText = '📎 File';
                break;
              default:
                lastMessageText = lastMsg.content;
            }
          }

          return {
            ...conv,
            last_message: lastMessageText,
            last_message_time: lastMsg?.created_at || conv.updated_at,
            unread_count: count || 0
          };
        })
      );

      console.log('Enhanced conversations:', enhancedConversations);
      setConversations(enhancedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!conversationId || !user) return;
    
    try {
      console.log('Fetching messages for conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      console.log('Fetched messages:', data);
      setMessages(data || []);

      // Mark messages as read (only messages not sent by current user)
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (updateError) {
        console.error('Error marking messages as read:', updateError);
      } else {
        fetchConversations();
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  }, [user, toast, fetchConversations]);

  // Send message (now handles both text and voice)
  const sendMessage = useCallback(async (content: string | Blob, messageType: string = 'text') => {
    if (!activeConversation || !user) return false;

    try {
      setSending(true);
      let messageContent = '';

      if (messageType === 'voice' && content instanceof Blob) {
        console.log('Processing voice message...');
        
        // Convert blob to base64 for storage
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64);
          };
        });
        
        reader.readAsDataURL(content);
        const base64Audio = await base64Promise;
        messageContent = base64Audio;
      } else if (typeof content === 'string') {
        messageContent = content.trim();
      }

      if (!messageContent) return false;

      console.log('Sending message:', { messageType, conversationId: activeConversation });

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation,
          sender_id: user.id,
          content: messageContent,
          message_type: messageType,
          is_read: false
        })
        .select(`
          *,
          sender:profiles(full_name)
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversation);

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return false;
    } finally {
      setSending(false);
    }
  }, [activeConversation, user, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for user:', user.id);

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('chat-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Real-time message received:', payload);
          const newMessage = payload.new as Message;
          
          if (newMessage.conversation_id === activeConversation) {
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              
              supabase
                .from('profiles')
                .select('full_name')
                .eq('id', newMessage.sender_id)
                .single()
                .then(({ data: senderData }) => {
                  setMessages(currentMessages => 
                    currentMessages.map(msg => 
                      msg.id === newMessage.id 
                        ? { ...msg, sender: senderData } 
                        : msg
                    )
                  );
                });
              
              return [...prev, newMessage];
            });
            
            if (newMessage.sender_id !== user.id) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
            }
          }

          setTimeout(() => {
            fetchConversations();
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('Conversation updated:', payload);
          setTimeout(() => {
            fetchConversations();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up real-time subscription');
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, activeConversation, fetchConversations]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    } else {
      setMessages([]);
    }
  }, [activeConversation, fetchMessages]);

  return {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    sendMessage,
    loading,
    sending,
    refreshConversations: fetchConversations
  };
};
