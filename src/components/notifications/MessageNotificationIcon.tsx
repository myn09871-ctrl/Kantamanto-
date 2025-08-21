
import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Link } from "react-router-dom";

const MessageNotificationIcon = () => {
  const { user } = useAuth();
  const { vendor } = useProfile();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        // Get conversations for this user
        let conversationsQuery = supabase
          .from('conversations')
          .select('id');

        if (vendor) {
          conversationsQuery = conversationsQuery.eq('vendor_id', vendor.id);
        } else {
          conversationsQuery = conversationsQuery.eq('customer_id', user.id);
        }

        const { data: conversations } = await conversationsQuery;
        
        if (!conversations || conversations.length === 0) {
          setUnreadCount(0);
          return;
        }

        const conversationIds = conversations.map(c => c.id);

        // Count unread messages (messages not sent by current user)
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', user.id);

        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new;
          // Only count if message is not from current user
          if (newMessage.sender_id !== user.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, vendor]);

  if (!user) return null;

  return (
    <Link to="/chat" className="relative">
      <MessageCircle className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Link>
  );
};

export default MessageNotificationIcon;
