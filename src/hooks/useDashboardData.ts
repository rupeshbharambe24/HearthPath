import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

      // Fetch relationships
      const { data: relationships, error: relationshipsError } = await supabase
        .from('relationships')
        .select(`
          *,
          partner:users!relationships_user_b_fkey(name, college_name)
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .eq('status', 'active');

      if (relationshipsError) {
        console.error('Error fetching relationships:', relationshipsError);
      }

      // Fetch memories count
      const { count: memoriesCount, error: memoriesError } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      if (memoriesError) {
        console.error('Error fetching memories:', memoriesError);
      }

      // Fetch latest message for last interaction
      const { data: lastMessage, error: messageError } = await supabase
        .from('messages')
        .select('created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (messageError && messageError.code !== 'PGRST116') {
        console.error('Error fetching last message:', messageError);
      }

      // Calculate stats
      const relationshipData = relationships || [];
      const currentLevel = relationshipData.length > 0 
        ? Math.max(...relationshipData.map(r => r.current_level || 1))
        : 1;

      const trustScore = relationshipData.length > 0
        ? Math.round(relationshipData.reduce((sum, r) => sum + (r.trust_score || 0), 0) / relationshipData.length)
        : 75;

      const heartsGiven = relationshipData.reduce((sum, r) => {
        return sum + (r.user_a === user.id ? (r.hearts_a2b || 0) : (r.hearts_b2a || 0));
      }, 0);

      const heartsReceived = relationshipData.reduce((sum, r) => {
        return sum + (r.user_a === user.id ? (r.hearts_b2a || 0) : (r.hearts_a2b || 0));
      }, 0);

      const recentMatches = relationshipData.slice(0, 3).map(rel => ({
        id: rel.id,
        name: rel.partner?.name || 'Unknown User',
        college: rel.partner?.college_name || 'Unknown College',
        level: rel.current_level || 1,
      }));

      setStats({
        currentLevel,
        trustScore,
        heartsGiven,
        heartsReceived,
        totalMatches: relationshipData.length,
        totalMemories: memoriesCount || 0,
        lastInteraction: lastMessage?.created_at || null,
        recentMatches,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchDashboardData };
};