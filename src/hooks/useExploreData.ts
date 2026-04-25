import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database, Tables } from '@/integrations/supabase/types';
import { runSupabaseQuery } from '@/lib/supabase-query';
import { withTimeout } from '@/lib/async';
import {
  buildCompatibilityInsert,
  buildCompatibilitySnapshot,
  buildSeriousnessSignals,
  type CompatibilityResult,
  type DiscoveryMode,
} from '@/lib/compatibility';

type ViewerProfile = Tables<'users'>;
type DiscoveryCandidate = Database['public']['Functions']['discovery_candidates']['Returns'][number];
type RelationshipRow = Tables<'relationships'>;
type BlockedRow = Tables<'blocked_users'>;

const DISCOVERY_BLOCKING_STATES = ['pending', 'active', 'exclusive', 'paused', 'cooldown'] as const;
const DAILY_INVITATION_LIMIT = 3;

type ExploreSuggestion = DiscoveryCandidate & {
  compatibility: CompatibilityResult;
  seriousnessSignals: string[];
};

function modeAllowsCandidate(viewer: ViewerProfile, candidate: DiscoveryCandidate, mode: DiscoveryMode) {
  switch (mode) {
    case 'friendship_first':
      return candidate.relationship_intent === 'Friendship first';
    case 'serious_only':
      return candidate.relationship_intent === 'Serious relationship';
    case 'same_campus':
      return Boolean(viewer.college_name && candidate.college_name === viewer.college_name);
    case 'slow_burn':
    default:
      return true;
  }
}

async function fetchExploreData(userId: string) {
  const [userResponse, relationshipResponse, blockedResponse, actionResponse] = await withTimeout(
    Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase
        .from('relationships')
        .select('id, user_a, user_b, lifecycle_state, current_stage')
        .or(`user_a.eq.${userId},user_b.eq.${userId}`),
      supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
      supabase
        .from('discovery_actions')
        .select('actor_user_id, target_user_id, action_type, action_date')
        .eq('actor_user_id', userId),
    ]),
    'Loading discovery prerequisites'
  );

  if (userResponse.error) throw new Error(userResponse.error.message || 'Loading your discovery preferences failed');
  if (relationshipResponse.error) throw new Error(relationshipResponse.error.message || 'Loading discovery relationships failed');
  if (blockedResponse.error) throw new Error(blockedResponse.error.message || 'Loading blocked users failed');
  if (actionResponse.error) throw new Error(actionResponse.error.message || 'Loading discovery history failed');

  const currentUser = userResponse.data as ViewerProfile;
  const relationshipRows = (relationshipResponse.data || []) as RelationshipRow[];
  const blockedRows = (blockedResponse.data || []) as BlockedRow[];
  const actionRows = actionResponse.data || [];

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

  actionRows.forEach((actionRow) => {
    if (actionRow.target_user_id) {
      excludedUserIds.add(actionRow.target_user_id);
    }
  });

  const profileResponse = await runSupabaseQuery(
    supabase.rpc('discovery_candidates', { p_limit: 40 }),
    'Loading discovery profiles'
  );
  const discoveryMode = (currentUser.discovery_mode || 'slow_burn') as DiscoveryMode;

  const profiles = ((profileResponse.data || []) as DiscoveryCandidate[])
    .filter((candidate) => !excludedUserIds.has(candidate.id))
    .filter((candidate) => candidate.access_state === 'active')
    .filter((candidate) => modeAllowsCandidate(currentUser, candidate, discoveryMode));

  const suggestions: ExploreSuggestion[] = profiles
    .map((candidate) => ({
      ...candidate,
      compatibility: buildCompatibilitySnapshot(currentUser, candidate, discoveryMode),
      seriousnessSignals: buildSeriousnessSignals(candidate),
    }))
    .sort((left, right) => {
      if (right.compatibility.score !== left.compatibility.score) {
        return right.compatibility.score - left.compatibility.score;
      }

      return (right.profile_completeness || 0) - (left.profile_completeness || 0);
    })
    .slice(0, 6);

  if (suggestions.length > 0) {
    const snapshotPayload = suggestions.map((candidate) =>
      buildCompatibilityInsert(currentUser.id, candidate.id, discoveryMode, candidate.compatibility)
    );

    void supabase.from('compatibility_snapshots').upsert(snapshotPayload, {
      onConflict: 'viewer_user_id,candidate_user_id,discovery_mode',
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const invitesSentToday = actionRows.filter(
    (actionRow) => actionRow.action_type === 'invite_sent' && actionRow.action_date === today
  ).length;

  return {
    profiles: suggestions,
    discoveryLocked,
    discoveryMode,
    invitesSentToday,
    invitationsRemaining: Math.max(0, DAILY_INVITATION_LIMIT - invitesSentToday),
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['explore-data', user?.id] });

  const updateModeMutation = useMutation({
    mutationFn: async (mode: DiscoveryMode) => {
      if (!user?.id) throw new Error('Not authenticated');
      await runSupabaseQuery(
        supabase.from('users').update({ discovery_mode: mode }).eq('id', user.id),
        'Updating discovery mode'
      );
      return mode;
    },
    onSuccess: () => {
      void invalidate();
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (query.data?.discoveryLocked) {
        throw new Error('Discovery is locked while you are in an exclusive HeartPath.');
      }
      if ((query.data?.invitationsRemaining || 0) <= 0) {
        throw new Error('You have reached today’s HeartPath invitation limit. Come back tomorrow for a fresh batch.');
      }

      const insertResponse = await runSupabaseQuery(
        supabase
          .from('relationships')
          .insert({
            user_a: user.id,
            user_b: targetUserId,
            lifecycle_state: 'pending',
            status: 'pending',
            current_stage: 1,
            current_level: 1,
            hearts_a2b: 0,
            hearts_b2a: 0,
            trust_score: 0,
          })
          .select('id')
          .single(),
        'Sending HeartPath request'
      );

      await runSupabaseQuery(
        supabase.from('discovery_actions').insert({
          actor_user_id: user.id,
          target_user_id: targetUserId,
          action_type: 'invite_sent',
          metadata: {
            discovery_mode: query.data?.discoveryMode || 'slow_burn',
          },
        }),
        'Recording discovery invite',
        8000
      );

      if (insertResponse.data?.id) {
        void supabase.from('relationship_events').insert({
          relationship_id: insertResponse.data.id,
          actor_user_id: user.id,
          event_type: 'request_received',
          metadata: {
            source: 'curated_discovery',
            discovery_mode: query.data?.discoveryMode || 'slow_burn',
          },
        });
      }

      return targetUserId;
    },
    onSuccess: () => {
      void invalidate();
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      await runSupabaseQuery(
        supabase.from('discovery_actions').insert({
          actor_user_id: user.id,
          target_user_id: targetUserId,
          action_type: 'pass',
          metadata: {
            discovery_mode: query.data?.discoveryMode || 'slow_burn',
          },
        }),
        'Saving discovery pass',
        8000
      );

      return targetUserId;
    },
    onSuccess: () => {
      void invalidate();
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

  const dismissSuggestion = async (targetUserId: string) => {
    try {
      await dismissMutation.mutateAsync(targetUserId);
      return { success: true as const };
    } catch (error: any) {
      console.error('Error saving discovery pass:', error);
      return { success: false as const, error: error.message || 'Failed to pass on this suggestion' };
    }
  };

  const updateDiscoveryMode = async (mode: DiscoveryMode) => {
    try {
      await updateModeMutation.mutateAsync(mode);
      return { success: true as const };
    } catch (error: any) {
      console.error('Error updating discovery mode:', error);
      return { success: false as const, error: error.message || 'Failed to update discovery mode' };
    }
  };

  return {
    profiles: query.data?.profiles || [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load profiles' : null,
    discoveryLocked: query.data?.discoveryLocked || false,
    discoveryMode: (query.data?.discoveryMode || 'slow_burn') as DiscoveryMode,
    invitesSentToday: query.data?.invitesSentToday || 0,
    invitationsRemaining: query.data?.invitationsRemaining || DAILY_INVITATION_LIMIT,
    sendChatRequest,
    dismissSuggestion,
    updateDiscoveryMode,
  };
};
