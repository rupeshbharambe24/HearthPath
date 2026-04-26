// src/hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePresence(targetUserId: string | null | undefined) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    setOnline(false);
    if (!targetUserId) return;
    const channel = supabase.channel(`presence-${targetUserId}`, {
      config: { presence: { key: 'observer' } },
    });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnline(Object.keys(state).some((k) => k === targetUserId));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  return online;
}
