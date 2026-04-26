import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

export type Notification = Database['public']['Tables']['notifications']['Row'];

const KEY = (uid: string) => ['notifications', uid] as const;

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: user ? KEY(user.id) : ['notifications', 'anon'],
    queryFn: () => fetchNotifications(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: KEY(user.id) })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      if (!user?.id) return { prev: undefined };
      const key = KEY(user.id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Notification[]>(key);
      qc.setQueryData<Notification[]>(key, (rows) =>
        rows?.map((r) =>
          r.id === id ? { ...r, read_at: new Date().toISOString() } : r
        ) ?? []
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (user?.id && ctx?.prev) qc.setQueryData(KEY(user.id), ctx.prev);
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_user_id', user.id)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user?.id) qc.invalidateQueries({ queryKey: KEY(user.id) });
    },
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user?.id) qc.invalidateQueries({ queryKey: KEY(user.id) });
    },
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    error: query.error,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    dismiss: dismiss.mutate,
  };
}
