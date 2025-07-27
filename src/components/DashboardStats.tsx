
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, MessageSquare, TrendingUp } from 'lucide-react';
import RelationshipBadge from './RelationshipBadge';
import TrustMeter from './TrustMeter';

interface DashboardStatsProps {
  userStats: {
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
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ userStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Current Level Card */}
      <Card className="romantic-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Current Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <RelationshipBadge level={userStats.currentLevel} />
          </div>
        </CardContent>
      </Card>

      {/* Trust Score Card */}
      <Card className="romantic-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Trust Meter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrustMeter trustScore={userStats.trustScore} />
        </CardContent>
      </Card>

      {/* Hearts Stats Card */}
      <Card className="romantic-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Hearts Exchange
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-romantic-red" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Given</span>
              </div>
              <span className="font-semibold text-romantic-red">{userStats.heartsGiven}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-romantic-pink fill-current" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Received</span>
              </div>
              <span className="font-semibold text-romantic-pink">{userStats.heartsReceived}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memories Card */}
      <Card className="romantic-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Memories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-romantic-red mb-1">
              {userStats.totalMemories}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Captured moments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Last Interaction Card */}
      <Card className="romantic-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Last Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <MessageSquare className="w-6 h-6 text-romantic-pink mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {userStats.lastInteraction 
                ? new Date(userStats.lastInteraction).toLocaleDateString()
                : 'No recent activity'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Match History Card */}
      <Card className="romantic-card md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
            <Users className="w-5 h-5" />
            <span>Recent Matches ({userStats.totalMatches} total)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userStats.recentMatches.length > 0 ? (
            <div className="space-y-3">
              {userStats.recentMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-romantic-dark-card rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">{match.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{match.college}</div>
                  </div>
                  <RelationshipBadge level={match.level} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center">
                <span className="text-xl">💝</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                No matches yet. Start exploring to find connections!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
