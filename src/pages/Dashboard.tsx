
import React from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import DashboardStats from '@/components/DashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useUserData';

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, relationships, loading } = useUserData();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
          <Sidebar />
          <main className="flex-1 lg:ml-64 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </AppLayout>
    );
  }

  // Calculate user stats from real data
  const userStats = {
    currentLevel: relationships.length > 0 ? Math.max(...relationships.map(r => r.current_level)) : 1,
    trustScore: relationships.length > 0 ? Math.round(relationships.reduce((sum, r) => sum + r.trust_score, 0) / relationships.length) : 75,
    heartsGiven: relationships.reduce((sum, r) => sum + (r.user_a === user?.id ? r.hearts_a2b : r.hearts_b2a), 0),
    heartsReceived: relationships.reduce((sum, r) => sum + (r.user_a === user?.id ? r.hearts_b2a : r.hearts_a2b), 0),
    totalMatches: relationships.length,
    recentMatches: relationships.slice(0, 3).map(rel => ({
      id: rel.id,
      name: rel.partner?.name || 'Unknown User',
      college: rel.partner?.college_name || 'Unknown College',
      level: rel.current_level || 1,
    })),
  };

  return (
    <AppLayout>
      <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {profile?.name || user?.name || 'User'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's your romantic journey overview.
              </p>
            </div>
            
            <DashboardStats userStats={userStats} />
            
            {relationships.length === 0 && (
              <div className="mt-8 text-center p-8 bg-white dark:bg-romantic-dark-card rounded-lg shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💕</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Start Your Journey
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Explore profiles to find your perfect match and begin meaningful connections.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
