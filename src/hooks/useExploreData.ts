import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { withTimeout } from '@/lib/async';

type ExploreProfile = Tables<'users'>;

const DISCOVERY_BLOCKING_STATES = ['pending', 'active', 'exclusive', 'paused', 'cooldown'] as const;

function formatInList(values: string[]) {
  return `(${values.map((value) => `"${value}"`).join(',')})`;
}

export const useExploreData = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ExploreProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discoveryLocked, setDiscoveryLocked] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setProfiles([]);
      return;
    }

    const fetchProfiles = async () => {
      try {
        setLoading(true);

        const [{ data: relationshipRows, error: relationshipError }, { data: blockedRows, error: blockedError }] =
          await withTimeout(
            Promise.all([
              supabase
                .from('relationships')
                .select('id, user_a, user_b, lifecycle_state, current_stage')
                .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
              supabase
                .from('blocked_users')
                .select('blocker_id, blocked_id')
                .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`),
            ]),
            10000,
            'Loading discovery prerequisites'
          );

        if (relationshipError) throw relationshipError;
        if (blockedError) throw blockedError;

        const blockingRelationships = (relationshipRows || []).filter((relationship) =>
          DISCOVERY_BLOCKING_STATES.includes(
            (relationship.lifecycle_state || 'pending') as (typeof DISCOVERY_BLOCKING_STATES)[number]
          )
        );

        const hasExclusiveLock = blockingRelationships.some(
          (relationship) => relationship.lifecycle_state === 'exclusive' || (relationship.current_stage || 1) >= 6
        );
        setDiscoveryLocked(hasExclusiveLock);

        const excludedUserIds = new Set<string>([user.id]);

        blockingRelationships.forEach((relationship) => {
          if (relationship.user_a) excludedUserIds.add(relationship.user_a);
          if (relationship.user_b) excludedUserIds.add(relationship.user_b);
        });

        (blockedRows || []).forEach((blockedRow) => {
          if (blockedRow.blocker_id === user.id && blockedRow.blocked_id) {
            excludedUserIds.add(blockedRow.blocked_id);
          }

          if (blockedRow.blocked_id === user.id && blockedRow.blocker_id) {
            excludedUserIds.add(blockedRow.blocker_id);
          }
        });

        let query = supabase
          .from('users')
          .select('id, name, college_name, branch, year, hobbies, about, photo_levels')
          .limit(20);

        const excludedList = Array.from(excludedUserIds);
        if (excludedList.length > 0) {
          query = query.not('id', 'in', formatInList(excludedList));
        }

        const { data: profilesData, error: profilesError } = await withTimeout(
          query,
          10000,
          'Loading discovery profiles'
        );

        if (profilesError) throw profilesError;

        setProfiles(profilesData || []);
        setError(null);
      } catch (fetchError) {
        console.error('Error loading explore profiles:', fetchError);
        setError('Failed to load profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user?.id]);

  const sendChatRequest = async (targetUserId: string) => {
    if (!user?.id) return { success: false as const, error: 'Not authenticated' };
    if (discoveryLocked) {
      return { success: false as const, error: 'Discovery is locked while you are in an exclusive HeartPath.' };
    }

    try {
      const { error: relationshipError } = await supabase.from('relationships').insert({
        user_a: user.id,
        user_b: targetUserId,
        lifecycle_state: 'pending',
        status: 'pending',
        current_stage: 1,
        current_level: 1,
        hearts_a2b: 0,
        hearts_b2a: 0,
        trust_score: 0,
      });

      if (relationshipError) throw relationshipError;

      setProfiles((previous) => previous.filter((profile) => profile.id !== targetUserId));
      return { success: true as const };
    } catch (requestError) {
      console.error('Error sending HeartPath request:', requestError);
      return { success: false as const, error: 'Failed to send request' };
    }
  };

  return { profiles, loading, error, discoveryLocked, sendChatRequest };
};
