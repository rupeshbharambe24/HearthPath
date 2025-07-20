
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  name: string;
  college_name: string | null;
  branch: string | null;
  year: number | null;
  about: string | null;
  hobbies: string[] | null;
  photo_levels: any;
}

interface UserRelationship {
  id: string;
  user_a: string;
  user_b: string;
  current_level: number;
  hearts_a2b: number;
  hearts_b2a: number;
  trust_score: number;
  status: string;
  partner: UserProfile;
}

export const useUserData = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [relationships, setRelationships] = useState<UserRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError('Failed to load profile');
          return;
        }

        setProfile(profileData);

        // Fetch relationships with partner details
        const { data: relationshipsData, error: relationshipsError } = await supabase
          .from('relationships')
          .select(`
            *,
            partner:users!relationships_user_b_fkey(*)
          `)
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
          .eq('status', 'active');

        if (relationshipsError) {
          console.error('Error fetching relationships:', relationshipsError);
        } else {
          // Process relationships to get correct partner data
          const processedRelationships = relationshipsData?.map(rel => {
            const isUserA = rel.user_a === user.id;
            const partnerId = isUserA ? rel.user_b : rel.user_a;
            
            return {
              ...rel,
              partner: rel.partner || { 
                id: partnerId, 
                name: 'Unknown User',
                college_name: null,
                branch: null,
                year: null,
                about: null,
                hobbies: null,
                photo_levels: null
              }
            };
          }) || [];

          setRelationships(processedRelationships);
        }

      } catch (err) {
        console.error('Error in fetchUserData:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  return { profile, relationships, loading, error };
};
