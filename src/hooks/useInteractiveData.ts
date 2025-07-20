import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RelationshipRequest {
  id: string;
  user_a: string;
  user_b: string;
  status: string;
  current_level: number;
  hearts_a2b: number;
  hearts_b2a: number;
  partner: {
    id: string;
    name: string;
    college_name: string | null;
  };
}

interface FunPost {
  id: string;
  type: string;
  question: string | null;
  message: string | null;
  target_user: string | null;
  owner_id: string | null;
  visible_to_target: boolean;
  correct_answer: string | null;
  created_at: string;
}

export const useInteractiveData = () => {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<RelationshipRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<RelationshipRequest[]>([]);
  const [activeRelationships, setActiveRelationships] = useState<RelationshipRequest[]>([]);
  const [funPosts, setFunPosts] = useState<FunPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchInteractiveData = async () => {
      try {
        setLoading(true);

        // Fetch relationship requests and active relationships
        const { data: relationshipsData, error: relationshipsError } = await supabase
          .from('relationships')
          .select(`
            *,
            partner:users!relationships_user_b_fkey(id, name, college_name)
          `)
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

        if (relationshipsError) {
          console.error('Error fetching relationships:', relationshipsError);
        } else {
          const processed = relationshipsData?.map(rel => {
            const isUserA = rel.user_a === user.id;
            return {
              ...rel,
              partner: rel.partner || {
                id: isUserA ? rel.user_b : rel.user_a,
                name: 'Unknown User',
                college_name: null
              }
            };
          }) || [];

          setIncomingRequests(processed.filter(r => r.status === 'pending' && r.user_b === user.id));
          setOutgoingRequests(processed.filter(r => r.status === 'pending' && r.user_a === user.id));
          setActiveRelationships(processed.filter(r => r.status === 'active'));
        }

        // Fetch fun posts (confessions, secrets, etc.)
        const { data: postsData, error: postsError } = await supabase
          .from('fun_posts')
          .select('*')
          .or(`target_user.eq.${user.id},owner_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (postsError) {
          console.error('Error fetching fun posts:', postsError);
        } else {
          setFunPosts(postsData || []);
        }

      } catch (err) {
        console.error('Error in fetchInteractiveData:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractiveData();

    // Set up real-time subscription for relationship updates
    const relationshipChannel = supabase
      .channel('relationships-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'relationships',
        filter: `user_a=eq.${user.id}`
      }, () => {
        fetchInteractiveData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'relationships',
        filter: `user_b=eq.${user.id}`
      }, () => {
        fetchInteractiveData();
      })
      .subscribe();

    return () => {
      relationshipChannel.unsubscribe();
    };
  }, [user?.id]);

  const acceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .update({ status: 'active' })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting request:', error);
        return { success: false };
      }

      return { success: true };
    } catch (err) {
      console.error('Error in acceptRequest:', err);
      return { success: false };
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        return { success: false };
      }

      return { success: true };
    } catch (err) {
      console.error('Error in rejectRequest:', err);
      return { success: false };
    }
  };

  const sendHeart = async (relationshipId: string) => {
    if (!user?.id) return { success: false };

    try {
      // Find the relationship to determine which heart column to increment
      const relationship = activeRelationships.find(r => r.id === relationshipId);
      if (!relationship) return { success: false };

      const isUserA = relationship.user_a === user.id;
      const heartColumn = isUserA ? 'hearts_a2b' : 'hearts_b2a';
      const currentHearts = isUserA ? relationship.hearts_a2b : relationship.hearts_b2a;

      const { error } = await supabase
        .from('relationships')
        .update({ [heartColumn]: currentHearts + 1 })
        .eq('id', relationshipId);

      if (error) {
        console.error('Error sending heart:', error);
        return { success: false };
      }

      return { success: true };
    } catch (err) {
      console.error('Error in sendHeart:', err);
      return { success: false };
    }
  };

  const createFunPost = async (postData: {
    type: string;
    question?: string;
    message?: string;
    target_user?: string;
    correct_answer?: string;
  }) => {
    if (!user?.id) return { success: false };

    try {
      const { error } = await supabase
        .from('fun_posts')
        .insert({
          ...postData,
          owner_id: user.id,
          visible_to_target: !!postData.target_user
        });

      if (error) {
        console.error('Error creating fun post:', error);
        return { success: false };
      }

      return { success: true };
    } catch (err) {
      console.error('Error in createFunPost:', err);
      return { success: false };
    }
  };

  return {
    incomingRequests,
    outgoingRequests,
    activeRelationships,
    funPosts,
    loading,
    acceptRequest,
    rejectRequest,
    sendHeart,
    createFunPost
  };
};