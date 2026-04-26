import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SignedMemoryAttachment {
  url: string;
  attachment_type: 'image' | 'audio' | 'pdf' | null;
  expiresAt: string;
}

export function useSignedMemoryAttachment(
  memoryId: string | null | undefined,
  hasAttachment: boolean
) {
  return useQuery({
    queryKey: ['signed-memory-attachment', memoryId],
    enabled: Boolean(memoryId) && hasAttachment,
    staleTime: 4 * 60 * 1000, // 4 min — sign expires at 5 min
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<SignedMemoryAttachment>(
        'signed-memory-attachment-url',
        { body: { memory_id: memoryId } }
      );
      if (error) throw error;
      if (!data) throw new Error('No data');
      return data;
    },
  });
}
