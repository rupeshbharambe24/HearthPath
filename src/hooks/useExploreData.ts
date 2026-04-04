import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { runSupabaseQuery } from '@/lib/supabase-query';
import { withTimeout } from '@/lib/async';

type ExploreProfile = Tables<'users'>;

const DISCOVERY_BLOCKING_STATES = ['pending', 'active', 'exclusive', 'paused', 'cooldown'] as const;

function formatInList(values: string[]) {
  return `(${values.map((value) => `"${value}"`).join(',')})`;
}

async function fetchExploreData(userId: string) {
  const [relationshipResponse, blockedResponse] = await withTimeout(
    Promise.all([
      supabase
        .from('relationships')
        .select('id, user_a, user_b, lifecycle_state, current_stage')
        .or(`user_a.eq.${userId},user_b.eq.${userId}`),
      supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
    ]),
    'Loading discovery prerequisites'
  );

  if (relationshipResponse.error) throw new Error(relationshipResponse.error.message || 'Loading discovery relationships failed');
  if (blockedResponse.error) throw new Error(blockedResponse.error.message || 'Loading blocked users failed');

  const relationshipRows = relationshipResponse.data || [];
  const blockedRows = blockedResponse.data || [];

  const blockingRelationships = relationshipRows.filter((relationship) =>
    DISCOVERY_BLOCKING_STATES.includes(
      (relationship.lifecycle_state || 'pending') as (typeof DISCOVERY_BLOCKING_STATES)[number]
    )
  );

  const discoveryLocked = blockingRelationships.some(
    (relationship) => relationship.lifecycle_state === 'exclusive' || (relationship.current_stage || 1) >= 6
  );

  const excludedUserIds = new Set<string>([userId]);

  blockingRelationships.forEach((relationship) => {
    if (relationship.user_a) excludedUserIds.add(relationship.user_a);
    if (relationship.user_b) excludedUserIds.add(relationship.user_b);
  });

  blockedRows.forEach((blockedRow) => {
    if (blockedRow.blocker_id === userId && blockedRow.blocked_id) excludedUserIds.add(blockedRow.blocked_id);
    if (blockedRow.blocked_id === userId && blockedRow.blocker_id) excludedUserIds.add(blockedRow.blocker_id);
  });

  let query = supabase
    .from('users')
    .select('id, name, college_name, branch, year, hobbies, about, photo_levels')
    .limit(20);

  const excludedList = Array.from(excludedUserIds);
  if (excludedList.length > 0) {
    query = query.not('id', 'in', formatInList(excludedList));
  }

  const profileResponse = await runSupabaseQuery(query, 'Loading discovery profiles');

  return {
    profiles: (profileResponse.data || []) as ExploreProfile[],
    discoveryLocked,
  };
}

export const useExploreData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['explore-data', user?.id],
    queryFn: () => fetchExploreData(user!.id),
    enabled: !!user?.id,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (query.data?.discoveryLocked) {
        throw new Error('Discovery is locked while you are in an exclusive HeartPath.');
      }

      await runSupabaseQuery(
        supabase.from('relationships').insert({
          user_a: user.id,
          user_b: targetUserId,
          lifecycle_state: 'pending',
          status: 'pending',
          current_stage: 1,
          current_level: 1,
          hearts_a2b: 0,
          hearts_b2a: 0,
          trust_score: 0,
        }),
        'Sending HeartPath request'
      );

      return targetUserId;
    },
    onSuccess: (targetUserId) => {
      queryClient.setQueryData(['explore-data', user?.id], (previous: { profiles: ExploreProfile[]; discoveryLocked: boolean } | undefined) => {
        if (!previous) return previous;
        return {
          ...previous,
          profiles: previous.profiles.filter((profile) => profile.id !== targetUserId),
        };
      });
    },
  });

  const sendChatRequest = async (targetUserId: string) => {
    try {
      await sendRequestMutation.mutateAsync(targetUserId);
      return { success: true as const };
    } catch (error: any) {
      console.error('Error sending HeartPath request:', error);
      return { success: false as const, error: error.message || 'Failed to send request' };
    }
  };

  return {
    profiles: query.data?.profiles || [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load profiles' : null,
    discoveryLocked: query.data?.discoveryLocked || false,
    sendChatRequest,
  };
};
