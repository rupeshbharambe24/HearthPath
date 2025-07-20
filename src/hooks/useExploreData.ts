import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ExploreProfile {
  id: string;
  name: string;
  college_name: string | null;
  branch: string | null;
  year: number | null;
  hobbies: string[] | null;
  about: string | null;
  photo_levels: any;
}

export const useExploreData = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ExploreProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfiles = async () => {
      try {
        setLoading(true);
        
        // Get all user IDs that current user already has relationships with
        const { data: existingRelationships } = await supabase
          .from('relationships')
          .select('user_a, user_b')
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

        const excludedUserIds = new Set([user.id]);
        existingRelationships?.forEach(rel => {
          excludedUserIds.add(rel.user_a);
          excludedUserIds.add(rel.user_b);
        });

        // Fetch available profiles excluding current user and existing connections
        const { data: profilesData, error: profilesError } = await supabase
          .from('users')
          .select('id, name, college_name, branch, year, hobbies, about, photo_levels')
          .not('id', 'in', `(${Array.from(excludedUserIds).join(',')})`)
          .limit(20);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setError('Failed to load profiles');
          return;
        }

        setProfiles(profilesData || []);
      } catch (err) {
        console.error('Error in fetchProfiles:', err);
        setError('Failed to load profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user?.id]);

  const sendChatRequest = async (targetUserId: string) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('relationships')
        .insert({
          user_a: user.id,
          user_b: targetUserId,
          status: 'pending',
          current_level: 1,
          hearts_a2b: 0,
          hearts_b2a: 0,
          trust_score: 0
        });

      if (error) {
        console.error('Error sending chat request:', error);
        return { success: false, error: 'Failed to send request' };
      }

      // Remove profile from list after sending request
      setProfiles(prev => prev.filter(p => p.id !== targetUserId));
      return { success: true };
    } catch (err) {
      console.error('Error in sendChatRequest:', err);
      return { success: false, error: 'Failed to send request' };
    }
  };

  return { profiles, loading, error, sendChatRequest };
};