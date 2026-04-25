import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSignedPhoto(targetUserId: string | null | undefined, level: 1 | 2 | 3 | 4 = 1) {
  return useQuery({
    queryKey: ['signed-photo', targetUserId, level],
    enabled: Boolean(targetUserId),
    staleTime: 4 * 60 * 1000, // 4 min — sign expires at 5 min
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ url: string; expiresAt: string }>(
        'signed-photo-url',
        { body: { targetUserId, level } }
      );
      if (error) throw error;
      return data?.url ?? null;
    },
  });
}
