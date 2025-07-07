
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, X } from 'lucide-react';

interface BlockedUser {
  id: string;
  name: string;
  college: string;
  blockedDate: string;
}

const BlockedUserList: React.FC = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      college: 'Computer Science',
      blockedDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sarah Williams',
      college: 'Business Administration',
      blockedDate: '2024-01-10'
    }
  ]);

  const handleUnblock = (userId: string) => {
    setBlockedUsers(prev => prev.filter(user => user.id !== userId));
  };

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
                      {user.college} • Blocked on {new Date(user.blockedDate).toLocaleDateString()}
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
