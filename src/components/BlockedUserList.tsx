import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BlockedUser {
  id: string;
  name: string;
  college_name: string;
  blockedDate: string;
  blocked_id: string;
}

const BlockedUserList: React.FC = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    void fetchBlockedUsers();
  }, [user?.id]);

  const fetchBlockedUsers = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id, blocked_id, created_at')
        .eq('blocker_id', user.id);

      if (error) throw error;

      // The users SELECT policy is locked down to self/partner only, so we
      // cannot read blocked users' rows directly. Use the SECURITY DEFINER RPC
      // which is filtered server-side to the caller's own block list.
      const { data: userData } = await supabase.rpc('blocked_user_summaries');

      const formattedUsers =
        data?.map((item) => {
          const userInfo = userData?.find((candidate) => candidate.id === item.blocked_id);
          return {
            id: item.id,
            blocked_id: item.blocked_id,
            name: userInfo?.name || 'Unknown User',
            college_name: userInfo?.college_name || 'Unknown College',
            blockedDate: item.created_at,
          };
        }) || [];

      setBlockedUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      toast.error('Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    try {
      const { error } = await supabase.from('blocked_users').delete().eq('id', blockId);
      if (error) throw error;

      setBlockedUsers((previous) => previous.filter((blockedUser) => blockedUser.id !== blockId));
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-romantic-red" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading blocked users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Blocked users cannot message or interact with you. They will also be removed from discovery.
          </p>
        </div>
      </div>

      {blockedUsers.length === 0 ? (
        <div className="py-8 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No blocked users</h3>
          <p className="text-gray-600 dark:text-gray-400">You have not blocked anyone yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Blocked Users ({blockedUsers.length})</h3>
          {blockedUsers.map((blockedUser) => (
            <Card key={blockedUser.id} className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{blockedUser.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {blockedUser.college_name} • Blocked on {new Date(blockedUser.blockedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleUnblock(blockedUser.id)}
                    className="text-romantic-red hover:bg-romantic-red hover:text-white"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Unblock
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedUserList;
