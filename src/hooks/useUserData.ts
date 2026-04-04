import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { withTimeout } from '@/lib/async';

type UserProfile = Tables<'users'>;

interface UserRelationship extends Tables<'relationships'> {
  partner: UserProfile | null;
}

const ACTIVE_RELATIONSHIP_STATES = ['active', 'exclusive', 'paused'] as const;

export const useUserData = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [relationships, setRelationships] = useState<UserRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setProfile(null);
      setRelationships([]);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);

        const { data: profileData, error: profileError } = await withTimeout(
          supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single(),
          8000,
          'Loading profile'
        );

        if (profileError) {
          throw profileError;
        }

        setProfile(profileData);

        const { data: relationshipRows, error: relationshipError } = await withTimeout(
          supabase
            .from('relationships')
            .select('*')
            .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
            .in('lifecycle_state', [...ACTIVE_RELATIONSHIP_STATES]),
          10000,
          'Loading user relationships'
        );

        if (relationshipError) {
          throw relationshipError;
        }

        const partnerIds = Array.from(
          new Set(
            (relationshipRows || [])
              .map((relationship) => (relationship.user_a === user.id ? relationship.user_b : relationship.user_a))
              .filter(Boolean) as string[]
          )
        );

        let partnerMap = new Map<string, UserProfile>();
        if (partnerIds.length > 0) {
          const { data: partnerRows, error: partnerError } = await withTimeout(
            supabase
              .from('users')
              .select('*')
              .in('id', partnerIds),
            8000,
            'Loading relationship partner profiles'
          );

          if (partnerError) {
            throw partnerError;
          }

          partnerMap = new Map((partnerRows || []).map((partner) => [partner.id, partner]));
        }

        const processedRelationships = (relationshipRows || []).map((relationship) => {
          const partnerId = relationship.user_a === user.id ? relationship.user_b : relationship.user_a;
          return {
            ...relationship,
            partner: partnerId ? partnerMap.get(partnerId) || null : null,
          };
        });

        setRelationships(processedRelationships);
        setError(null);
      } catch (fetchError) {
        console.error('Error loading user data:', fetchError);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  return { profile, relationships, loading, error };
};
