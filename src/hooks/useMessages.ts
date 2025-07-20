
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  content_type: string;
}

interface ChatPreview {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);

        // Get all messages for the current user
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }

        setMessages(messagesData || []);

        // Generate chat previews
        const chatMap = new Map<string, ChatPreview>();
        
        for (const message of messagesData || []) {
          const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
          
          if (!chatMap.has(partnerId)) {
            // Get partner name
            const { data: partnerData } = await supabase
              .from('users')
              .select('name')
              .eq('id', partnerId)
              .single();

            chatMap.set(partnerId, {
              partnerId,
              partnerName: partnerData?.name || 'Unknown User',
              lastMessage: message.content || '',
              lastMessageTime: message.created_at,
              unreadCount: 0
            });
          } else {
            // Update with latest message
            const existing = chatMap.get(partnerId)!;
            if (new Date(message.created_at) > new Date(existing.lastMessageTime)) {
              existing.lastMessage = message.content || '';
              existing.lastMessageTime = message.created_at;
            }
          }
        }

        setChatPreviews(Array.from(chatMap.values()).sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        ));

      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription for messages with error handling
    let messagesChannel: any = null;
    
    const setupRealtimeSubscription = () => {
      try {
        messagesChannel = supabase
          .channel(`messages-realtime-${user.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${user.id}`
          }, (payload) => {
            console.log('Real-time message update:', payload);
            setTimeout(() => fetchMessages(), 100);
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          }, (payload) => {
            console.log('Real-time message update:', payload);
            setTimeout(() => fetchMessages(), 100);
          })
          .subscribe((status) => {
            if (status !== 'SUBSCRIBED') {
              console.log('Messages realtime subscription status:', status);
              if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                setTimeout(setupRealtimeSubscription, 5000);
              }
            }
          });
      } catch (error) {
        console.error('Error setting up messages realtime subscription:', error);
      }
    };

    // Delay initial subscription to avoid connection issues
    const subscriptionTimeout = setTimeout(setupRealtimeSubscription, 2000);

    return () => {
      clearTimeout(subscriptionTimeout);
      if (messagesChannel) {
        messagesChannel.unsubscribe();
      }
    };
  }, [user?.id]);

  const getMessagesWithPartner = (partnerId: string) => {
    return messages.filter(msg => 
      (msg.sender_id === user?.id && msg.receiver_id === partnerId) ||
      (msg.sender_id === partnerId && msg.receiver_id === user?.id)
    );
  };

  return { messages, chatPreviews, loading, getMessagesWithPartner };
};
