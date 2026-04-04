import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { withTimeout } from '@/lib/async';

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

  const fetchMessages = async (showLoader = true) => {
    if (!user?.id) {
      setMessages([]);
      setChatPreviews([]);
      setLoading(false);
      return;
    }

    try {
      if (showLoader) setLoading(true);

      const { data: messageRows, error: messageError } = await withTimeout(
        supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: true }),
        10000,
        'Loading messages'
      );

      if (messageError) throw messageError;

      const nextMessages = messageRows || [];
      setMessages(nextMessages);

      const partnerIds = Array.from(
        new Set(
          nextMessages
            .map((message) => (message.sender_id === user.id ? message.receiver_id : message.sender_id))
            .filter(Boolean)
        )
      );

      let partnerMap = new Map<string, string>();
      if (partnerIds.length > 0) {
        const { data: userRows, error: userError } = await withTimeout(
          supabase
            .from('users')
            .select('id, name')
            .in('id', partnerIds),
          8000,
          'Loading chat partner names'
        );

        if (userError) throw userError;
        partnerMap = new Map((userRows || []).map((partner) => [partner.id, partner.name]));
      }

      const previewMap = new Map<string, ChatPreview>();
      for (const message of nextMessages) {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const currentPreview = previewMap.get(partnerId);

        if (!currentPreview || new Date(message.created_at) > new Date(currentPreview.lastMessageTime)) {
          previewMap.set(partnerId, {
            partnerId,
            partnerName: partnerMap.get(partnerId) || 'Unknown User',
            lastMessage: message.content || '',
            lastMessageTime: message.created_at,
            unreadCount: 0,
          });
        }
      }

      setChatPreviews(
        Array.from(previewMap.values()).sort(
          (left, right) => new Date(right.lastMessageTime).getTime() - new Date(left.lastMessageTime).getTime()
        )
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchMessages(true);

    const channel = supabase
      .channel(`messages-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` },
        () => void fetchMessages(false)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => void fetchMessages(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getMessagesWithPartner = (partnerId: string) =>
    messages.filter(
      (message) =>
        (message.sender_id === user?.id && message.receiver_id === partnerId) ||
        (message.sender_id === partnerId && message.receiver_id === user?.id)
    );

  return { messages, chatPreviews, loading, getMessagesWithPartner };
};
