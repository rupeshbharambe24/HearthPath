import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { runSupabaseQuery } from '@/lib/supabase-query';

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

async function fetchDashboardData(userId: string): Promise<DashboardStats> {
  const relationshipResponse = await runSupabaseQuery(
    supabase
      .from('relationships')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .in('lifecycle_state', [...ACTIVE_RELATIONSHIP_STATES]),
    'Loading dashboard relationships'
  );

  const relationshipRows = relationshipResponse.data || [];
  const partnerIds = Array.from(
    new Set(
      relationshipRows
        .map((relationship) => (relationship.user_a === userId ? relationship.user_b : relationship.user_a))
        .filter(Boolean) as string[]
    )
  );

  let partnerMap = new Map<string, UserRow>();
  if (partnerIds.length > 0) {
    const partnerResponse = await runSupabaseQuery(
      supabase.from('users').select('id, name, college_name').in('id', partnerIds),
      'Loading dashboard partner names',
      8000
    );
    partnerMap = new Map((partnerResponse.data || []).map((partner) => [partner.id, partner]));
  }

  const memoriesResponse = await runSupabaseQuery(
    supabase.from('memories').select('*', { count: 'exact', head: true }).eq('created_by', userId),
    'Loading dashboard memories',
    8000
  );

  const lastMessageResponse = await runSupabaseQuery(
    supabase
      .from('messages')
      .select('created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    'Loading dashboard activity',
    8000
  );

  const primaryRelationship = pickPrimaryRelationship(relationshipRows);
  const currentLevel =
    primaryRelationship?.current_stage ||
    primaryRelationship?.current_level ||
    (relationshipRows.length > 0
      ? Math.max(...relationshipRows.map((relationship) => relationship.current_stage || relationship.current_level || 1))
      : 1);

  const trustScore =
    relationshipRows.length > 0
      ? Math.round(
          relationshipRows.reduce((sum, relationship) => sum + (relationship.trust_score || 0), 0) /
            relationshipRows.length
        )
      : 75;

  const heartsGiven = relationshipRows.reduce((sum, relationship) => {
    return sum + (relationship.user_a === userId ? relationship.hearts_a2b || 0 : relationship.hearts_b2a || 0);
  }, 0);

  const heartsReceived = relationshipRows.reduce((sum, relationship) => {
    return sum + (relationship.user_a === userId ? relationship.hearts_b2a || 0 : relationship.hearts_a2b || 0);
  }, 0);

  const recentMatches = relationshipRows.slice(0, 3).map((relationship) => {
    const partnerId = relationship.user_a === userId ? relationship.user_b : relationship.user_a;
    const partner = partnerId ? partnerMap.get(partnerId) : null;

    return {
      id: relationship.id,
      name: partner?.name || 'Unknown User',
      college: partner?.college_name || 'Unknown College',
      level: relationship.current_stage || relationship.current_level || 1,
    };
  });

  return {
    currentLevel,
    trustScore,
    heartsGiven,
    heartsReceived,
    totalMatches: relationshipRows.length,
    totalMemories: memoriesResponse.count || 0,
    lastInteraction: lastMessageResponse.data?.created_at || null,
    recentMatches,
    primaryLifecycleState: primaryRelationship?.lifecycle_state || null,
  };
}

export const useDashboardData = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: () => fetchDashboardData(user!.id),
    enabled: !!user?.id,
  });

  return {
    stats:
      query.data || {
        currentLevel: 1,
        trustScore: 75,
        heartsGiven: 0,
        heartsReceived: 0,
        totalMatches: 0,
        totalMemories: 0,
        lastInteraction: null,
        recentMatches: [],
        primaryLifecycleState: null,
      },
    loading: query.isLoading,
    refetch: query.refetch,
  };
};
