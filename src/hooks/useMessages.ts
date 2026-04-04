import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { runSupabaseQuery } from '@/lib/supabase-query';

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

async function fetchMessagesData(userId: string) {
  const messageResponse = await runSupabaseQuery(
    supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true }),
    'Loading messages'
  );

  const messages = (messageResponse.data || []) as Message[];
  const partnerIds = Array.from(
    new Set(
      messages
        .map((message) => (message.sender_id === userId ? message.receiver_id : message.sender_id))
        .filter(Boolean)
    )
  );

  let partnerMap = new Map<string, string>();
  if (partnerIds.length > 0) {
    const partnerResponse = await runSupabaseQuery(
      supabase.from('users').select('id, name').in('id', partnerIds),
      'Loading chat partner names',
      8000
    );

    partnerMap = new Map((partnerResponse.data || []).map((partner) => [partner.id, partner.name]));
  }

  const previewMap = new Map<string, ChatPreview>();
  for (const message of messages) {
    const partnerId = message.sender_id === userId ? message.receiver_id : message.sender_id;
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

  return {
    messages,
    chatPreviews: Array.from(previewMap.values()).sort(
      (left, right) => new Date(right.lastMessageTime).getTime() - new Date(left.lastMessageTime).getTime()
    ),
  };
}

export const useMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: () => fetchMessagesData(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', user.id] });
    };

    const channel = supabase
      .channel(`messages-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` },
        refresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  const getMessagesWithPartner = (partnerId: string) =>
    (query.data?.messages || []).filter(
      (message) =>
        (message.sender_id === user?.id && message.receiver_id === partnerId) ||
        (message.sender_id === partnerId && message.receiver_id === user?.id)
    );

  return {
    messages: query.data?.messages || [],
    chatPreviews: query.data?.chatPreviews || [],
    loading: query.isLoading,
    getMessagesWithPartner,
  };
};
