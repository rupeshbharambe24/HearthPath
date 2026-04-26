// src/hooks/useSignedVoiceMessage.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SignedVoice {
  url: string;
  expiresAt: string;
}

export function useSignedVoiceMessage(
  messageId: string | null | undefined,
  isVoice: boolean
) {
  return useQuery({
    queryKey: ['signed-voice-message', messageId],
    enabled: Boolean(messageId) && isVoice,
    staleTime: 4 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<SignedVoice>(
        'signed-voice-message-url',
        { body: { message_id: messageId } }
      );
      if (error) throw error;
      if (!data) throw new Error('No data');
      return data;
    },
  });
}
