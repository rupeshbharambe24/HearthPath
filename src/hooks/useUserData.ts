import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { runSupabaseQuery } from '@/lib/supabase-query';

type UserProfile = Tables<'users'>;

interface UserRelationship extends Tables<'relationships'> {
  partner: UserProfile | null;
}

const ACTIVE_RELATIONSHIP_STATES = ['active', 'exclusive', 'paused'] as const;

async function fetchUserData(userId: string) {
  const profileResponse = await runSupabaseQuery(
    supabase.from('users').select('*').eq('id', userId).single(),
    'Loading profile',
    8000
  );

  const relationshipResponse = await runSupabaseQuery(
    supabase
      .from('relationships')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .in('lifecycle_state', [...ACTIVE_RELATIONSHIP_STATES]),
    'Loading user relationships'
  );

  const relationshipRows = relationshipResponse.data || [];
  const partnerIds = Array.from(
    new Set(
      relationshipRows
        .map((relationship) => (relationship.user_a === userId ? relationship.user_b : relationship.user_a))
        .filter(Boolean) as string[]
    )
  );

  let partnerMap = new Map<string, UserProfile>();
  if (partnerIds.length > 0) {
    const partnerResponse = await runSupabaseQuery(
      supabase.from('users').select('*').in('id', partnerIds),
      'Loading relationship partner profiles',
      8000
    );

    partnerMap = new Map((partnerResponse.data || []).map((partner) => [partner.id, partner]));
  }

  const relationships: UserRelationship[] = relationshipRows.map((relationship) => {
    const partnerId = relationship.user_a === userId ? relationship.user_b : relationship.user_a;
    return {
      ...relationship,
      partner: partnerId ? partnerMap.get(partnerId) || null : null,
    };
  });

  return {
    profile: profileResponse.data || null,
    relationships,
  };
}

export const useUserData = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['user-data', user?.id],
    queryFn: () => fetchUserData(user!.id),
    enabled: !!user?.id,
  });

  return {
    profile: query.data?.profile || null,
    relationships: query.data?.relationships || [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load user data' : null,
    refetch: query.refetch,
  };
};
