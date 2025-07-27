
import React, { useState, useEffect } from 'react';
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
    fetchBlockedUsers();
  }, [user]);

  const fetchBlockedUsers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_id,
          created_at
        `)
        .eq('blocker_id', user.id);

      if (error) throw error;

      // Get user details for blocked users
      const blockedUserIds = data?.map(item => item.blocked_id) || [];
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, college_name')
        .in('id', blockedUserIds);

      const formattedUsers = data?.map(item => {
        const userInfo = userData?.find(u => u.id === item.blocked_id);
        return {
          id: item.id,
          blocked_id: item.blocked_id,
          name: userInfo?.name || 'Unknown User',
          college_name: userInfo?.college_name || 'Unknown College',
          blockedDate: item.created_at
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
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(user => user.id !== blockId));
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romantic-red mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading blocked users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Blocked users cannot message or interact with you. They won't be able to see your profile or find you in discovery.
          </p>
        </div>
      </div>

      {blockedUsers.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No blocked users
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You haven't blocked anyone yet. Blocked users will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Blocked Users ({blockedUsers.length})
          </h3>
          {blockedUsers.map((user) => (
            <Card key={user.id} className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.college_name} • Blocked on {new Date(user.blockedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(user.id)}
                    className="text-romantic-red hover:bg-romantic-red hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1" />
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
