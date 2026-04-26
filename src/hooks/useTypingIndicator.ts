import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TYPING_TTL_MS = 3500; // clear "typing…" if no broadcast for 3.5s
const DEBOUNCE_MS = 1500;   // emit at most once per 1.5s

function chatChannelName(a: string, b: string) {
  return `chat-typing-${[a, b].sort().join(':')}`;
}

export function useTypingIndicator(
  selfId: string | null | undefined,
  partnerId: string | null | undefined
) {
  const [partnerTyping, setPartnerTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastBroadcast = useRef(0);
  const partnerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!selfId || !partnerId) return;
    const channel = supabase
      .channel(chatChannelName(selfId, partnerId), {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'typing' }, (msg) => {
        const from = (msg.payload as { from?: string } | undefined)?.from;
        if (from && from === partnerId) {
          setPartnerTyping(true);
          if (partnerTimeout.current) clearTimeout(partnerTimeout.current);
          partnerTimeout.current = setTimeout(
            () => setPartnerTyping(false),
            TYPING_TTL_MS
          );
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (partnerTimeout.current) clearTimeout(partnerTimeout.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
      setPartnerTyping(false);
    };
  }, [selfId, partnerId]);

  function emitTyping() {
    const now = Date.now();
    if (now - lastBroadcast.current < DEBOUNCE_MS) return;
    lastBroadcast.current = now;
    if (!channelRef.current || !selfId) return;
    void channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { from: selfId },
    });
  }

  return { partnerTyping, emitTyping };
}
