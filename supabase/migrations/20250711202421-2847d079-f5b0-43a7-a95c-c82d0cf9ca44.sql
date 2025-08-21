
-- Add is_read column to messages table for message status tracking
ALTER TABLE public.messages 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Create index for better performance on read status queries
CREATE INDEX idx_messages_is_read ON public.messages(conversation_id, is_read, sender_id);

-- Update existing messages to be marked as read (optional)
UPDATE public.messages SET is_read = TRUE WHERE created_at < NOW();
