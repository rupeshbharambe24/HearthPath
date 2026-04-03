import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

interface DashboardStats {
  currentLevel: number;
  trustScore: number;
  heartsGiven: number;
  heartsReceived: number;
  totalMatches: number;
  totalMemories: number;
  lastInteraction: string | null;
  recentMatches: Array<{
    id: string;
    name: string;
    college: string;
    level: number;
  }>;
  primaryLifecycleState: string | null;
}

type RelationshipRow = Tables<'relationships'>;
type UserRow = Tables<'users'>;

const ACTIVE_RELATIONSHIP_STATES = ['active', 'exclusive', 'paused'] as const;

function pickPrimaryRelationship(relationships: RelationshipRow[]) {
  const priority = ['exclusive', 'active', 'paused'] as const;

  for (const state of priority) {
    const found = relationships.find((relationship) => relationship.lifecycle_state === state);
    if (found) return found;
  }

  return null;
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    currentLevel: 1,
    trustScore: 75,
    heartsGiven: 0,
    heartsReceived: 0,
    totalMatches: 0,
    totalMemories: 0,
    lastInteraction: null,
    recentMatches: [],
    primaryLifecycleState: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: relationshipRows, error: relationshipError } = await supabase
        .from('relationships')
        .select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .in('lifecycle_state', [...ACTIVE_RELATIONSHIP_STATES]);

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

      let partnerMap = new Map<string, UserRow>();
      if (partnerIds.length > 0) {
        const { data: partnerRows, error: partnerError } = await supabase
          .from('users')
          .select('id, name, college_name')
          .in('id', partnerIds);

        if (partnerError) {
          throw partnerError;
        }

        partnerMap = new Map((partnerRows || []).map((partner) => [partner.id, partner]));
      }

      const { count: memoriesCount, error: memoriesError } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      if (memoriesError) {
        throw memoriesError;
      }

      const { data: lastMessage, error: messageError } = await supabase
        .from('messages')
        .select('created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (messageError) {
        throw messageError;
      }

      const relationshipData = relationshipRows || [];
      const primaryRelationship = pickPrimaryRelationship(relationshipData);

      const currentLevel =
        primaryRelationship?.current_stage ||
        primaryRelationship?.current_level ||
        (relationshipData.length > 0
          ? Math.max(...relationshipData.map((relationship) => relationship.current_stage || relationship.current_level || 1))
          : 1);

      const trustScore =
        relationshipData.length > 0
          ? Math.round(
              relationshipData.reduce((sum, relationship) => sum + (relationship.trust_score || 0), 0) /
                relationshipData.length
            )
          : 75;

      const heartsGiven = relationshipData.reduce((sum, relationship) => {
        return sum + (relationship.user_a === user.id ? relationship.hearts_a2b || 0 : relationship.hearts_b2a || 0);
      }, 0);

      const heartsReceived = relationshipData.reduce((sum, relationship) => {
        return sum + (relationship.user_a === user.id ? relationship.hearts_b2a || 0 : relationship.hearts_a2b || 0);
      }, 0);

      const recentMatches = relationshipData.slice(0, 3).map((relationship) => {
        const partnerId = relationship.user_a === user.id ? relationship.user_b : relationship.user_a;
        const partner = partnerId ? partnerMap.get(partnerId) : null;

        return {
          id: relationship.id,
          name: partner?.name || 'Unknown User',
          college: partner?.college_name || 'Unknown College',
          level: relationship.current_stage || relationship.current_level || 1,
        };
      });

      setStats({
        currentLevel,
        trustScore,
        heartsGiven,
        heartsReceived,
        totalMatches: relationshipData.length,
        totalMemories: memoriesCount || 0,
        lastInteraction: lastMessage?.created_at || null,
        recentMatches,
        primaryLifecycleState: primaryRelationship?.lifecycle_state || null,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchDashboardData };
};
